package tn.moonside.postservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.postservice.audit.AuditClient;
import tn.moonside.postservice.audit.PostAuditAction;
import tn.moonside.postservice.clients.UserClient;
import tn.moonside.postservice.dtos.requests.ReactionRequest;
import tn.moonside.postservice.dtos.responses.ReactionResponse;
import tn.moonside.postservice.dtos.responses.ReactionSummaryResponse;
import tn.moonside.postservice.entities.Comment;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.entities.Reaction;
import tn.moonside.postservice.entities.ReactionType;
import tn.moonside.postservice.kafka.NotificationEventPublisher;
import tn.moonside.postservice.repositories.CommentRepository;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.ReactionRepository;
import tn.moonside.postservice.repositories.ReactionTypeRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReactionServiceTest {

    @Mock private ReactionRepository reactionRepository;
    @Mock private ReactionTypeRepository reactionTypeRepository;
    @Mock private AuditClient auditClient;
    @Mock private UserClient userClient;
    @Mock private PostRepository postRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private NotificationEventPublisher notificationPublisher;

    @InjectMocks
    private ReactionService reactionService;

    private ReactionType likeType;
    private Post post;

    @BeforeEach
    void setUp() {
        likeType = ReactionType.builder().id("rt1").code("LIKE").emoji("👍").build();
        post = Post.builder().id("p1").authorId("author1").createdAt(LocalDateTime.now()).build();
    }

    @Test
    void toggleReaction_newReaction_savesAndNotifies() {
        ReactionRequest req = new ReactionRequest();
        req.setReactionTypeCode("LIKE");

        when(reactionTypeRepository.findByCode("LIKE")).thenReturn(Optional.of(likeType));
        when(reactionRepository.findByUserIdAndReactableTypeAndReactableId("u2", "POST", "p1"))
                .thenReturn(Optional.empty());
        when(reactionRepository.save(any(Reaction.class))).thenAnswer(inv -> {
            Reaction r = inv.getArgument(0);
            r.setId("r1");
            return r;
        });
        when(userClient.displayName("u2")).thenReturn("Charlie");
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("author1")).thenReturn("Author");

        ReactionResponse response = reactionService.toggleReaction("POST", "p1", req, "u2");

        assertThat(response.getId()).isEqualTo("r1");
        verify(notificationPublisher).publish(any());
        verify(auditClient).log(eq("u2"), eq("p1"), eq("POST"), eq(PostAuditAction.REACTION_ADDED),
                anyString(), eq(true), any(), eq("LIKE"));
    }

    @Test
    void toggleReaction_ownPost_doesNotNotify() {
        ReactionRequest req = new ReactionRequest();
        req.setReactionTypeCode("LIKE");

        when(reactionTypeRepository.findByCode("LIKE")).thenReturn(Optional.of(likeType));
        when(reactionRepository.findByUserIdAndReactableTypeAndReactableId("author1", "POST", "p1"))
                .thenReturn(Optional.empty());
        when(reactionRepository.save(any(Reaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("author1")).thenReturn("Author");
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));

        reactionService.toggleReaction("POST", "p1", req, "author1");

        verify(notificationPublisher, never()).publish(any());
    }

    @Test
    void toggleReaction_unknownType_throws() {
        ReactionRequest req = new ReactionRequest();
        req.setReactionTypeCode("BAD");

        when(reactionTypeRepository.findByCode("BAD")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reactionService.toggleReaction("POST", "p1", req, "u1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void toggleReaction_sameReaction_removesAndReturnsNull() {
        ReactionRequest req = new ReactionRequest();
        req.setReactionTypeCode("LIKE");
        Reaction existing = Reaction.builder().id("r1").userId("u1")
                .reactionTypeId("rt1").reactableType("POST").reactableId("p1").build();

        when(reactionTypeRepository.findByCode("LIKE")).thenReturn(Optional.of(likeType));
        when(reactionRepository.findByUserIdAndReactableTypeAndReactableId("u1", "POST", "p1"))
                .thenReturn(Optional.of(existing));
        when(userClient.displayName("u1")).thenReturn("Alice");
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("author1")).thenReturn("Author");

        ReactionResponse response = reactionService.toggleReaction("POST", "p1", req, "u1");

        assertThat(response).isNull();
        verify(reactionRepository).delete(existing);
        verify(auditClient).log(eq("u1"), eq("p1"), eq("POST"), eq(PostAuditAction.REACTION_REMOVED),
                anyString(), eq(true), eq("LIKE"), any());
    }

    @Test
    void toggleReaction_differentReaction_switches() {
        ReactionType loveType = ReactionType.builder().id("rt2").code("LOVE").emoji("❤️").build();
        ReactionRequest req = new ReactionRequest();
        req.setReactionTypeCode("LOVE");
        Reaction existing = Reaction.builder().id("r1").userId("u1")
                .reactionTypeId("rt1").reactableType("POST").reactableId("p1").build();

        when(reactionTypeRepository.findByCode("LOVE")).thenReturn(Optional.of(loveType));
        when(reactionRepository.findByUserIdAndReactableTypeAndReactableId("u1", "POST", "p1"))
                .thenReturn(Optional.of(existing));
        when(reactionTypeRepository.findById("rt1")).thenReturn(Optional.of(likeType));
        when(reactionRepository.save(existing)).thenReturn(existing);
        when(userClient.displayName("u1")).thenReturn("Alice");
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("author1")).thenReturn("Author");

        ReactionResponse response = reactionService.toggleReaction("POST", "p1", req, "u1");

        assertThat(response.getReactionTypeId()).isEqualTo("rt2");
        verify(auditClient).log(eq("u1"), eq("p1"), eq("POST"), eq(PostAuditAction.REACTION_CHANGED),
                anyString(), eq(true), eq("LIKE"), eq("LOVE"));
    }

    @Test
    void getSummary_groupsByEmojiAndFindsUserReaction() {
        Reaction r1 = Reaction.builder().id("r1").userId("u1").reactionTypeId("rt1")
                .reactableType("POST").reactableId("p1").build();
        Reaction r2 = Reaction.builder().id("r2").userId("u2").reactionTypeId("rt1")
                .reactableType("POST").reactableId("p1").build();

        when(reactionRepository.findByReactableTypeAndReactableId("POST", "p1")).thenReturn(List.of(r1, r2));
        when(reactionTypeRepository.findById("rt1")).thenReturn(Optional.of(likeType));

        ReactionSummaryResponse summary = reactionService.getSummary("POST", "p1", "u1");

        assertThat(summary.getTotal()).isEqualTo(2);
        assertThat(summary.getByEmoji().get("👍")).isEqualTo(2L);
        assertThat(summary.getUserReaction()).isNotNull();
        assertThat(summary.getUserReaction().getUserId()).isEqualTo("u1");
    }

    @Test
    void getSummary_noUserReaction_isNull() {
        Reaction r1 = Reaction.builder().id("r1").userId("u2").reactionTypeId("rt1")
                .reactableType("POST").reactableId("p1").build();

        when(reactionRepository.findByReactableTypeAndReactableId("POST", "p1")).thenReturn(List.of(r1));
        when(reactionTypeRepository.findById("rt1")).thenReturn(Optional.of(likeType));

        ReactionSummaryResponse summary = reactionService.getSummary("POST", "p1", "u1");

        assertThat(summary.getUserReaction()).isNull();
    }

    @Test
    void getReactors_mapsAndFiltersNulls() {
        Reaction r1 = Reaction.builder().id("r1").userId("u1").reactionTypeId("rt1")
                .reactableType("POST").reactableId("p1").build();
        Reaction r2 = Reaction.builder().id("r2").userId("u2").reactionTypeId("missing")
                .reactableType("POST").reactableId("p1").build();

        when(reactionRepository.findByReactableTypeAndReactableId("POST", "p1")).thenReturn(List.of(r1, r2));
        when(reactionTypeRepository.findById("rt1")).thenReturn(Optional.of(likeType));
        when(reactionTypeRepository.findById("missing")).thenReturn(Optional.empty());

        List<ReactionResponse> result = reactionService.getReactors("POST", "p1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo("u1");
    }

    @Test
    void toggleReaction_commentReactableType_resolvesCommentOwner() {
        Comment comment = Comment.builder().id("c1").authorId("commentAuthor").build();
        ReactionRequest req = new ReactionRequest();
        req.setReactionTypeCode("LIKE");

        when(reactionTypeRepository.findByCode("LIKE")).thenReturn(Optional.of(likeType));
        when(reactionRepository.findByUserIdAndReactableTypeAndReactableId("u2", "COMMENT", "c1"))
                .thenReturn(Optional.empty());
        when(reactionRepository.save(any(Reaction.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("u2")).thenReturn("Charlie");
        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));
        when(userClient.displayName("commentAuthor")).thenReturn("CommentAuthor");

        reactionService.toggleReaction("COMMENT", "c1", req, "u2");

        verify(notificationPublisher).publish(any());
    }
}
