package tn.moonside.postservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import tn.moonside.postservice.audit.AuditClient;
import tn.moonside.postservice.audit.PostAuditAction;
import tn.moonside.postservice.clients.OrganizationClient;
import tn.moonside.postservice.clients.UserClient;
import tn.moonside.postservice.dtos.requests.CommentRequest;
import tn.moonside.postservice.dtos.responses.CommentResponse;
import tn.moonside.postservice.entities.Comment;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.kafka.NotificationEventPublisher;
import tn.moonside.postservice.repositories.CommentRepository;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.ReactionRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private PostRepository postRepository;
    @Mock private ReactionRepository reactionRepository;
    @Mock private OrganizationClient organizationClient;
    @Mock private AuditClient auditClient;
    @Mock private UserClient userClient;
    @Mock private NotificationEventPublisher notificationPublisher;

    @InjectMocks
    private CommentService commentService;

    private Post post;

    @BeforeEach
    void setUp() {
        post = Post.builder().id("p1").authorId("postAuthor").build();
    }

    @Test
    void addComment_topLevel_success() {
        CommentRequest req = new CommentRequest();
        req.setContent("Nice post!");

        when(postRepository.existsById("p1")).thenReturn(true);
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId("c1");
            return c;
        });
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("commenter")).thenReturn("Commenter");
        when(userClient.displayName("postAuthor")).thenReturn("PostAuthor");
        when(commentRepository.countByParentId("c1")).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("COMMENT", "c1")).thenReturn(0L);

        CommentResponse response = commentService.addComment("p1", req, "commenter");

        assertThat(response.getId()).isEqualTo("c1");
        verify(notificationPublisher).publish(any());
        verify(auditClient).log(eq("commenter"), eq("c1"), eq("COMMENT"), eq(PostAuditAction.COMMENT_ADDED),
                anyString(), eq(true), any(), anyString());
    }

    @Test
    void addComment_postNotFound_throws() {
        CommentRequest req = new CommentRequest();
        req.setContent("Hi");
        when(postRepository.existsById("missing")).thenReturn(false);

        assertThatThrownBy(() -> commentService.addComment("missing", req, "u1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void addComment_parentNotFound_throws() {
        CommentRequest req = new CommentRequest();
        req.setContent("Hi");
        req.setParentId("bad-parent");

        when(postRepository.existsById("p1")).thenReturn(true);
        when(commentRepository.existsById("bad-parent")).thenReturn(false);

        assertThatThrownBy(() -> commentService.addComment("p1", req, "u1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void addComment_reply_notifiesParentCommentAuthor() {
        CommentRequest req = new CommentRequest();
        req.setContent("A reply");
        req.setParentId("parent1");
        Comment parentComment = Comment.builder().id("parent1").authorId("parentAuthor").postId("p1").build();

        when(postRepository.existsById("p1")).thenReturn(true);
        when(commentRepository.existsById("parent1")).thenReturn(true);
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId("c2");
            return c;
        });
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("replier")).thenReturn("Replier");
        when(commentRepository.findById("parent1")).thenReturn(Optional.of(parentComment));
        when(userClient.displayName("parentAuthor")).thenReturn("ParentAuthor");
        when(commentRepository.countByParentId("c2")).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("COMMENT", "c2")).thenReturn(0L);

        commentService.addComment("p1", req, "replier");

        verify(notificationPublisher).publish(any());
    }

    @Test
    void addComment_withMentions_publishesMentionNotifications() {
        CommentRequest req = new CommentRequest();
        req.setContent("Hey @bob");
        req.setMentionedUserIds(List.of("bob", "commenter"));

        when(postRepository.existsById("p1")).thenReturn(true);
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> {
            Comment c = inv.getArgument(0);
            c.setId("c3");
            return c;
        });
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("commenter")).thenReturn("Commenter");
        when(userClient.displayName("postAuthor")).thenReturn("PostAuthor");
        when(commentRepository.countByParentId("c3")).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("COMMENT", "c3")).thenReturn(0L);

        commentService.addComment("p1", req, "commenter");

        // one for post-author top-level notification, one for the mention (bob only, not self)
        verify(notificationPublisher, times(2)).publish(any());
    }

    @Test
    void getTopLevelComments_returnsPage() {
        Comment c = Comment.builder().id("c1").postId("p1").build();
        Page<Comment> page = new PageImpl<>(List.of(c));
        when(commentRepository.findByPostIdAndParentIdIsNull(eq("p1"), any())).thenReturn(page);
        when(commentRepository.countByParentId("c1")).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("COMMENT", "c1")).thenReturn(0L);

        Page<CommentResponse> result = commentService.getTopLevelComments("p1", 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getByAuthor_returnsPage() {
        Comment c = Comment.builder().id("c1").authorId("u1").build();
        when(commentRepository.findByAuthorId(eq("u1"), any())).thenReturn(new PageImpl<>(List.of(c)));
        when(commentRepository.countByParentId("c1")).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("COMMENT", "c1")).thenReturn(0L);

        Page<CommentResponse> result = commentService.getByAuthor("u1", 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getReplies_success() {
        Comment reply = Comment.builder().id("c2").parentId("c1").build();
        when(commentRepository.existsById("c1")).thenReturn(true);
        when(commentRepository.findByParentId(eq("c1"), any())).thenReturn(new PageImpl<>(List.of(reply)));
        when(commentRepository.countByParentId("c2")).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("COMMENT", "c2")).thenReturn(0L);

        Page<CommentResponse> result = commentService.getReplies("c1", 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getReplies_commentNotFound_throws() {
        when(commentRepository.existsById("missing")).thenReturn(false);

        assertThatThrownBy(() -> commentService.getReplies("missing", 0, 10))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateComment_byOwner_success() {
        Comment comment = Comment.builder().id("c1").authorId("owner").postId("p1").content("old").build();
        CommentRequest req = new CommentRequest();
        req.setContent("new content");

        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("owner")).thenReturn("Owner");
        when(commentRepository.countByParentId("c1")).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("COMMENT", "c1")).thenReturn(0L);

        CommentResponse response = commentService.updateComment("c1", req, "owner", List.of());

        assertThat(response.getContent()).isEqualTo("new content");
        assertThat(comment.isEdited()).isTrue();
    }

    @Test
    void updateComment_notOwnerNoRoles_throws() {
        Comment comment = Comment.builder().id("c1").authorId("owner").postId("p1").build();
        CommentRequest req = new CommentRequest();
        req.setContent("hack");

        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.updateComment("c1", req, "intruder", List.of()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updateComment_ceoRole_bypassesChecks() {
        Comment comment = Comment.builder().id("c1").authorId("owner").postId("p1").content("old").build();
        CommentRequest req = new CommentRequest();
        req.setContent("moderated");

        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("ceoUser")).thenReturn("CEO");
        when(userClient.displayName("owner")).thenReturn("Owner");
        when(commentRepository.countByParentId("c1")).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("COMMENT", "c1")).thenReturn(0L);

        CommentResponse response = commentService.updateComment("c1", req, "ceoUser", List.of("CEO"));

        assertThat(response.getContent()).isEqualTo("moderated");
    }

    @Test
    void updateComment_teamLeaderWithLeadPermission_allowed() {
        Comment comment = Comment.builder().id("c1").authorId("owner").postId("p1").content("old").build();
        Post teamPost = Post.builder().id("p1").authorId("postAuthor").teamId("team1").build();
        CommentRequest req = new CommentRequest();
        req.setContent("moderated");

        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));
        when(postRepository.findById("p1")).thenReturn(Optional.of(teamPost));
        when(organizationClient.isTeamLead("team1", "leader1")).thenReturn(true);
        when(commentRepository.save(any(Comment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("leader1")).thenReturn("Leader");
        when(userClient.displayName("owner")).thenReturn("Owner");
        when(commentRepository.countByParentId("c1")).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("COMMENT", "c1")).thenReturn(0L);

        CommentResponse response = commentService.updateComment("c1", req, "leader1", List.of("TEAM_LEADER"));

        assertThat(response.getContent()).isEqualTo("moderated");
    }

    @Test
    void deleteComment_byOwner_success() {
        Comment comment = Comment.builder().id("c1").authorId("owner").postId("p1").content("bye").build();

        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));
        when(commentRepository.findAllReplies("c1")).thenReturn(List.of());
        when(userClient.displayName("owner")).thenReturn("Owner");

        commentService.deleteComment("c1", "owner");

        verify(reactionRepository).deleteByReactableTypeAndReactableId("COMMENT", "c1");
        verify(commentRepository).delete(comment);
    }

    @Test
    void deleteComment_notOwner_throws() {
        Comment comment = Comment.builder().id("c1").authorId("owner").build();
        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> commentService.deleteComment("c1", "intruder"))
                .isInstanceOf(AccessDeniedException.class);
        verify(commentRepository, never()).delete(any());
    }

    @Test
    void deleteComment_cascadesToReplies() {
        Comment comment = Comment.builder().id("c1").authorId("owner").content("root").build();
        Comment reply = Comment.builder().id("c2").authorId("owner").parentId("c1").content("reply").build();

        when(commentRepository.findById("c1")).thenReturn(Optional.of(comment));
        when(commentRepository.findAllReplies("c1")).thenReturn(List.of(reply));
        when(commentRepository.findAllReplies("c2")).thenReturn(List.of());
        when(userClient.displayName("owner")).thenReturn("Owner");

        commentService.deleteComment("c1", "owner");

        verify(commentRepository).delete(reply);
        verify(commentRepository).delete(comment);
        verify(reactionRepository).deleteByReactableTypeAndReactableId("COMMENT", "c2");
        verify(reactionRepository).deleteByReactableTypeAndReactableId("COMMENT", "c1");
    }
}
