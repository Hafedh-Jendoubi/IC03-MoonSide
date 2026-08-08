package tn.moonside.postservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import tn.moonside.postservice.dtos.responses.PostStatsResponse;
import tn.moonside.postservice.entities.Comment;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.entities.Reaction;
import tn.moonside.postservice.entities.ReactionType;
import tn.moonside.postservice.enums.TypePosts;
import tn.moonside.postservice.repositories.CommentRepository;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.ReactionRepository;
import tn.moonside.postservice.repositories.ReactionTypeRepository;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostStatsServiceTest {

    @Mock private MongoTemplate mongoTemplate;
    @Mock private PostRepository postRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private ReactionRepository reactionRepository;
    @Mock private ReactionTypeRepository reactionTypeRepository;

    @InjectMocks
    private PostStatsService postStatsService;

    @BeforeEach
    void setUp() {
        when(postRepository.count()).thenReturn(10L);
        when(commentRepository.count()).thenReturn(20L);
        when(reactionRepository.count()).thenReturn(30L);
    }

    @Test
    void getStats_emptyData_returnsZeroedButWellFormedResponse() {
        when(mongoTemplate.find(any(Query.class), eq(Post.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(Comment.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(Reaction.class))).thenReturn(List.of());
        when(mongoTemplate.findAll(Post.class)).thenReturn(List.of());
        when(mongoTemplate.findAll(Reaction.class)).thenReturn(List.of());
        when(reactionTypeRepository.findAll()).thenReturn(List.of());

        PostStatsResponse stats = postStatsService.getStats();

        assertThat(stats.getTotalPosts()).isEqualTo(10L);
        assertThat(stats.getTotalComments()).isEqualTo(20L);
        assertThat(stats.getTotalReactions()).isEqualTo(30L);
        assertThat(stats.getPostsToday()).isZero();
        assertThat(stats.getActivityByHour()).hasSize(24);
        assertThat(stats.getPostsPerDay()).hasSize(14);
        assertThat(stats.getAvgCommentsPerPost()).isEqualTo(2.0);
        assertThat(stats.getAvgReactionsPerPost()).isEqualTo(3.0);
        assertThat(stats.getPostsByType()).isEmpty();
        assertThat(stats.getReactionsByType()).isEmpty();
    }

    @Test
    void getStats_zeroTotalPosts_avoidsDivisionByZero() {
        when(postRepository.count()).thenReturn(0L);
        when(mongoTemplate.find(any(Query.class), eq(Post.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(Comment.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(Reaction.class))).thenReturn(List.of());
        when(mongoTemplate.findAll(Post.class)).thenReturn(List.of());
        when(mongoTemplate.findAll(Reaction.class)).thenReturn(List.of());
        when(reactionTypeRepository.findAll()).thenReturn(List.of());

        PostStatsResponse stats = postStatsService.getStats();

        assertThat(stats.getAvgCommentsPerPost()).isZero();
        assertThat(stats.getAvgReactionsPerPost()).isZero();
    }

    @Test
    void getStats_withData_countsAndGroupsByType() {
        LocalDateTime now = LocalDateTime.now();
        Post postToday = Post.builder().id("p1").postType(TypePosts.DISCUSSION).createdAt(now).build();

        when(mongoTemplate.find(any(Query.class), eq(Post.class))).thenReturn(List.of(postToday));
        when(mongoTemplate.find(any(Query.class), eq(Comment.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(Reaction.class))).thenReturn(List.of());

        Post p1 = Post.builder().id("p1").postType(TypePosts.DISCUSSION).build();
        Post p2 = Post.builder().id("p2").postType(TypePosts.DISCUSSION).build();
        Post p3 = Post.builder().id("p3").postType(TypePosts.ANNOUNCEMENT).build();
        when(mongoTemplate.findAll(Post.class)).thenReturn(List.of(p1, p2, p3));

        ReactionType likeType = ReactionType.builder().id("rt1").code("LIKE").emoji("👍").name("Like").build();
        Reaction r1 = Reaction.builder().id("r1").reactionTypeId("rt1").build();
        Reaction r2 = Reaction.builder().id("r2").reactionTypeId("rt1").build();
        when(mongoTemplate.findAll(Reaction.class)).thenReturn(List.of(r1, r2));
        when(reactionTypeRepository.findAll()).thenReturn(List.of(likeType));

        PostStatsResponse stats = postStatsService.getStats();

        assertThat(stats.getPostsToday()).isEqualTo(1L);
        assertThat(stats.getPostsByType()).hasSize(2);
        assertThat(stats.getPostsByType().get(0).getName()).isEqualTo("DISCUSSION");
        assertThat(stats.getPostsByType().get(0).getCount()).isEqualTo(2L);
        assertThat(stats.getReactionsByType()).hasSize(1);
        assertThat(stats.getReactionsByType().get(0).getCode()).isEqualTo("LIKE");
        assertThat(stats.getReactionsByType().get(0).getCount()).isEqualTo(2L);
    }

    @Test
    void getStats_unknownReactionType_fallsBackToUnknownLabels() {
        when(mongoTemplate.find(any(Query.class), eq(Post.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(Comment.class))).thenReturn(List.of());
        when(mongoTemplate.find(any(Query.class), eq(Reaction.class))).thenReturn(List.of());
        when(mongoTemplate.findAll(Post.class)).thenReturn(List.of());

        Reaction orphan = Reaction.builder().id("r1").reactionTypeId("nonexistent").build();
        when(mongoTemplate.findAll(Reaction.class)).thenReturn(List.of(orphan));
        when(reactionTypeRepository.findAll()).thenReturn(List.of());

        PostStatsResponse stats = postStatsService.getStats();

        assertThat(stats.getReactionsByType()).hasSize(1);
        assertThat(stats.getReactionsByType().get(0).getCode()).isEqualTo("UNKNOWN");
        assertThat(stats.getReactionsByType().get(0).getName()).isEqualTo("Unknown");
    }
}
