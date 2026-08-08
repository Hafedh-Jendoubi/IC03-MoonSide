package tn.moonside.postservice.services;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import tn.moonside.postservice.audit.AuditClient;
import tn.moonside.postservice.audit.PostAuditAction;
import tn.moonside.postservice.clients.ConnectionClient;
import tn.moonside.postservice.clients.OrganizationClient;
import tn.moonside.postservice.clients.UserClient;
import tn.moonside.postservice.dtos.requests.PostRequest;
import tn.moonside.postservice.dtos.responses.PagedResponse;
import tn.moonside.postservice.dtos.responses.PostResponse;
import tn.moonside.postservice.entities.Attachment;
import tn.moonside.postservice.entities.Comment;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.entities.Reaction;
import tn.moonside.postservice.enums.TypePosts;
import tn.moonside.postservice.enums.VisibilityType;
import tn.moonside.postservice.kafka.NotificationEventPublisher;
import tn.moonside.postservice.kafka.PostActivityEventPublisher;
import tn.moonside.postservice.repositories.*;

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
class PostServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private AttachmentRepository attachmentRepository;
    @Mock private ReactionRepository reactionRepository;
    @Mock private ReactionTypeRepository reactionTypeRepository;
    @Mock private SurveyVoteRepository surveyVoteRepository;
    @Mock private OrganizationClient organizationClient;
    @Mock private ConnectionClient connectionClient;
    @Mock private SurveyService surveyService;
    @Mock private AuditClient auditClient;
    @Mock private UserClient userClient;
    @Mock private NotificationEventPublisher notificationPublisher;
    @Mock private PostActivityEventPublisher postActivityPublisher;
    @Mock private RedisTemplate<String, Object> redisTemplate;
    @Mock private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private PostService postService;

    private Post post;

    @BeforeEach
    void setUp() {
        post = Post.builder().id("p1").authorId("author1").content("Hello")
                .postType(TypePosts.DISCUSSION).postVisibility(VisibilityType.PUBLIC)
                .createdAt(LocalDateTime.now()).build();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String userId) {
        SecurityContext ctx = SecurityContextHolder.createEmptyContext();
        ctx.setAuthentication(new UsernamePasswordAuthenticationToken(userId, null, List.of()));
        SecurityContextHolder.setContext(ctx);
    }

    private void stubAttachmentsAndReactionCounts(String postId) {
        when(attachmentRepository.findByPostId(postId)).thenReturn(List.of());
        when(commentRepository.countByPostId(postId)).thenReturn(0L);
        when(reactionRepository.countByReactableTypeAndReactableId("POST", postId)).thenReturn(0L);
    }

    // ── createPost ───────────────────────────────────────────────────────────

    @Test
    void createPost_noTeamOrDept_success() {
        PostRequest req = new PostRequest();
        req.setContent("Hello world");
        req.setPostType(TypePosts.DISCUSSION);

        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId("p1");
            return p;
        });
        when(userClient.displayName("author1")).thenReturn("Author");
        when(postRepository.countByAuthorId("author1")).thenReturn(1L);
        stubAttachmentsAndReactionCounts("p1");

        PostResponse response = postService.createPost(req, "author1");

        assertThat(response.getId()).isEqualTo("p1");
        assertThat(response.getPostVisibility()).isEqualTo(VisibilityType.PUBLIC);
        verify(auditClient).log(eq("author1"), eq("p1"), eq("POST"), eq(PostAuditAction.POST_CREATED),
                anyString(), eq(true), any(), anyString());
        verify(postActivityPublisher).publish(any());
    }

    @Test
    void createPost_withTeam_notMember_throws() {
        PostRequest req = new PostRequest();
        req.setTeamId("team1");

        when(organizationClient.isTeamLead("team1", "u1")).thenReturn(false);
        when(organizationClient.isTeamMember("team1", "u1")).thenReturn(false);
        when(organizationClient.hasRole("u1", "CEO")).thenReturn(false);

        assertThatThrownBy(() -> postService.createPost(req, "u1"))
                .isInstanceOf(AccessDeniedException.class);
        verify(postRepository, never()).save(any());
    }

    @Test
    void createPost_withTeam_asMember_derivesTeamVisibility() {
        PostRequest req = new PostRequest();
        req.setTeamId("team1");
        req.setContent("Team post");

        when(organizationClient.isTeamLead("team1", "u1")).thenReturn(false);
        when(organizationClient.isTeamMember("team1", "u1")).thenReturn(true);
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId("p2");
            return p;
        });
        when(userClient.displayName("u1")).thenReturn("U1");
        when(postRepository.countByAuthorId("u1")).thenReturn(1L);
        stubAttachmentsAndReactionCounts("p2");

        PostResponse response = postService.createPost(req, "u1");

        assertThat(response.getPostVisibility()).isEqualTo(VisibilityType.TEAM_ONLY);
    }

    @Test
    void createPost_withDept_notMember_throws() {
        PostRequest req = new PostRequest();
        req.setDepartmentId("dept1");

        when(organizationClient.isDepartmentManager("dept1", "u1")).thenReturn(false);
        when(organizationClient.isDepartmentMember("dept1", "u1")).thenReturn(false);
        when(organizationClient.hasRole("u1", "CEO")).thenReturn(false);

        assertThatThrownBy(() -> postService.createPost(req, "u1"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void createPost_survey_missingQuestion_throws() {
        PostRequest req = new PostRequest();
        req.setPostType(TypePosts.SURVEY);
        req.setSurveyOptions(List.of("A", "B"));

        assertThatThrownBy(() -> postService.createPost(req, "u1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createPost_survey_tooFewOptions_throws() {
        PostRequest req = new PostRequest();
        req.setPostType(TypePosts.SURVEY);
        req.setSurveyQuestion("Q?");
        req.setSurveyOptions(List.of("A"));

        assertThatThrownBy(() -> postService.createPost(req, "u1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createPost_survey_tooManyOptions_throws() {
        PostRequest req = new PostRequest();
        req.setPostType(TypePosts.SURVEY);
        req.setSurveyQuestion("Q?");
        req.setSurveyOptions(List.of("1","2","3","4","5","6","7","8","9","10","11"));

        assertThatThrownBy(() -> postService.createPost(req, "u1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createPost_withMentions_publishesNotifications() {
        PostRequest req = new PostRequest();
        req.setContent("Hey @bob");
        req.setMentionedUserIds(List.of("bob"));

        when(postRepository.save(any(Post.class))).thenAnswer(inv -> {
            Post p = inv.getArgument(0);
            p.setId("p3");
            return p;
        });
        when(userClient.displayName("author1")).thenReturn("Author");
        when(postRepository.countByAuthorId("author1")).thenReturn(1L);
        stubAttachmentsAndReactionCounts("p3");

        postService.createPost(req, "author1");

        verify(notificationPublisher).publish(any());
    }

    // ── getById / recordView ────────────────────────────────────────────────

    @Test
    void getById_success() {
        authenticateAs("viewer1");
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        stubAttachmentsAndReactionCounts("p1");

        PostResponse response = postService.getById("p1");

        assertThat(response.getId()).isEqualTo("p1");
    }

    @Test
    void getById_notFound_throws() {
        when(postRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.getById("missing"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getById_surveyPost_buildsSurveyResponse() {
        authenticateAs("viewer1");
        Post survey = Post.builder().id("p1").authorId("author1").postType(TypePosts.SURVEY)
                .createdAt(LocalDateTime.now()).build();
        when(postRepository.findById("p1")).thenReturn(Optional.of(survey));
        stubAttachmentsAndReactionCounts("p1");
        when(surveyService.buildSurveyResponse(eq(survey), eq("viewer1"))).thenReturn(null);

        postService.getById("p1");

        verify(surveyService).buildSurveyResponse(survey, "viewer1");
    }

    @Test
    void recordView_incrementsRedisCounter() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        postService.recordView("p1");

        verify(valueOperations).increment("post:views:p1");
    }

    // ── feeds ────────────────────────────────────────────────────────────────

    @Test
    void getPublicFeed_returnsPagedResponse() {
        when(postRepository.findByPostVisibilityIn(eq(List.of(VisibilityType.PUBLIC)), any()))
                .thenReturn(new PageImpl<>(List.of(post)));
        stubAttachmentsAndReactionCounts("p1");

        PagedResponse<PostResponse> result = postService.getPublicFeed(0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getFollowingFeed_noFollows_returnsEmptyPage() {
        when(organizationClient.getUserFollows()).thenReturn(OrganizationClient.UserFollows.empty());

        Page<PostResponse> result = postService.getFollowingFeed("u1", 0, 10);

        assertThat(result.getContent()).isEmpty();
        verify(postRepository, never()).findFollowingFeed(any(), any(), any(), any());
    }

    @Test
    void getFollowingFeed_withFollows_queriesRepository() {
        OrganizationClient.UserFollows follows =
                new OrganizationClient.UserFollows(List.of("dept1"), List.of(), List.of(), List.of());
        when(organizationClient.getUserFollows()).thenReturn(follows);
        when(postRepository.findFollowingFeed(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(post)));
        stubAttachmentsAndReactionCounts("p1");

        Page<PostResponse> result = postService.getFollowingFeed("u1", 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getConnectionsFeed_noConnections_returnsEmptyPage() {
        when(connectionClient.getConnectionIds("u1")).thenReturn(List.of());

        Page<PostResponse> result = postService.getConnectionsFeed("u1", 0, 10);

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void getConnectionsFeed_withConnections_queriesRepository() {
        when(connectionClient.getConnectionIds("u1")).thenReturn(List.of("conn1"));
        when(reactionRepository.findByUserIdInAndReactableType(List.of("conn1"), "POST"))
                .thenReturn(List.of());
        when(commentRepository.findByAuthorIdIn(List.of("conn1"))).thenReturn(List.of());
        when(postRepository.findConnectionsFeed(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(post)));
        stubAttachmentsAndReactionCounts("p1");

        Page<PostResponse> result = postService.getConnectionsFeed("u1", 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getPersonalizedFeed_noFollowsNoConnections_stillQueries() {
        when(organizationClient.getUserFollows()).thenReturn(OrganizationClient.UserFollows.empty());
        when(connectionClient.getConnectionIds("u1")).thenReturn(List.of());
        when(postRepository.findPersonalizedFeed(any(), any(), any(), any(), any(), any(), anyString(), any()))
                .thenReturn(new PageImpl<>(List.of()));

        Page<PostResponse> result = postService.getPersonalizedFeed("u1", 0, 10);

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void getByAuthor_returnsPage() {
        authenticateAs("viewer1");
        when(postRepository.findByAuthorId(eq("author1"), any())).thenReturn(new PageImpl<>(List.of(post)));
        stubAttachmentsAndReactionCounts("p1");

        Page<PostResponse> result = postService.getByAuthor("author1", 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getByTeam_returnsPage() {
        authenticateAs("viewer1");
        when(postRepository.findByTeamIdAndPostVisibilityInSorted(eq("team1"), any(), any()))
                .thenReturn(new PageImpl<>(List.of(post)));
        stubAttachmentsAndReactionCounts("p1");

        Page<PostResponse> result = postService.getByTeam("team1", 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getByDepartment_returnsPage() {
        authenticateAs("viewer1");
        when(postRepository.findByDepartmentIdAndPostVisibilityInSorted(eq("dept1"), any(), any()))
                .thenReturn(new PageImpl<>(List.of(post)));
        stubAttachmentsAndReactionCounts("p1");

        Page<PostResponse> result = postService.getByDepartment("dept1", 0, 10);

        assertThat(result.getContent()).hasSize(1);
    }

    // ── updatePost ───────────────────────────────────────────────────────────

    @Test
    void updatePost_byOwner_success() {
        PostRequest req = new PostRequest();
        req.setContent("Updated content");
        req.setPostType(TypePosts.DISCUSSION);

        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("author1")).thenReturn("Author");
        stubAttachmentsAndReactionCounts("p1");

        PostResponse response = postService.updatePost("p1", req, "author1", List.of());

        assertThat(response.getContent()).isEqualTo("Updated content");
        verify(auditClient).log(eq("author1"), eq("p1"), eq("POST"), eq(PostAuditAction.POST_UPDATED),
                anyString(), eq(true), anyString(), anyString());
    }

    @Test
    void updatePost_notOwnerNoRoles_throws() {
        PostRequest req = new PostRequest();
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> postService.updatePost("p1", req, "intruder", List.of()))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void updatePost_ceo_bypassesOwnershipCheck() {
        PostRequest req = new PostRequest();
        req.setContent("Moderated");
        req.setPostType(TypePosts.DISCUSSION);

        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("ceoUser")).thenReturn("CEO");
        stubAttachmentsAndReactionCounts("p1");

        PostResponse response = postService.updatePost("p1", req, "ceoUser", List.of("CEO"));

        assertThat(response.getContent()).isEqualTo("Moderated");
    }

    @Test
    void updatePost_surveyType_updatesOptions() {
        Post surveyPost = Post.builder().id("p1").authorId("author1").postType(TypePosts.SURVEY)
                .surveyQuestion("Old?").createdAt(LocalDateTime.now()).build();
        PostRequest req = new PostRequest();
        req.setPostType(TypePosts.SURVEY);
        req.setSurveyQuestion("New question?");
        req.setSurveyOptions(List.of("Yes", "No"));

        when(postRepository.findById("p1")).thenReturn(Optional.of(surveyPost));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("author1")).thenReturn("Author");
        stubAttachmentsAndReactionCounts("p1");
        when(surveyService.buildSurveyResponse(any(), any())).thenReturn(null);

        postService.updatePost("p1", req, "author1", List.of());

        assertThat(surveyPost.getSurveyQuestion()).isEqualTo("New question?");
        assertThat(surveyPost.getSurveyOptions()).hasSize(2);
    }

    @Test
    void updatePost_notFound_throws() {
        PostRequest req = new PostRequest();
        when(postRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.updatePost("missing", req, "u1", List.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── togglePin ────────────────────────────────────────────────────────────

    @Test
    void togglePin_fromUnpinned_pinsAndLogs() {
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("author1")).thenReturn("Author");
        stubAttachmentsAndReactionCounts("p1");

        PostResponse response = postService.togglePin("p1", "author1", List.of());

        assertThat(response.isPinned()).isTrue();
        verify(auditClient).log(eq("author1"), eq("p1"), eq("POST"), eq(PostAuditAction.POST_PINNED),
                anyString(), eq(true), any(), any());
    }

    @Test
    void togglePin_fromPinned_unpinsAndLogs() {
        post.setPinned(true);
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("author1")).thenReturn("Author");
        stubAttachmentsAndReactionCounts("p1");

        PostResponse response = postService.togglePin("p1", "author1", List.of());

        assertThat(response.isPinned()).isFalse();
        verify(auditClient).log(eq("author1"), eq("p1"), eq("POST"), eq(PostAuditAction.POST_UNPINNED),
                anyString(), eq(true), any(), any());
    }

    @Test
    void togglePin_unauthorized_throws() {
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> postService.togglePin("p1", "intruder", List.of()))
                .isInstanceOf(AccessDeniedException.class);
    }

    // ── deletePost ───────────────────────────────────────────────────────────

    @Test
    void deletePost_byOwner_cascadesAndLogs() {
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("author1")).thenReturn("Author");

        postService.deletePost("p1", "author1", List.of());

        verify(commentRepository).deleteByPostId("p1");
        verify(attachmentRepository).deleteByPostId("p1");
        verify(reactionRepository).deleteByReactableTypeAndReactableId("POST", "p1");
        verify(surveyVoteRepository).deleteByPostId("p1");
        verify(postRepository).delete(post);
        verify(auditClient).log(eq("author1"), eq("p1"), eq("POST"), eq(PostAuditAction.POST_DELETED),
                anyString(), eq(true), anyString(), any());
    }

    @Test
    void deletePost_byModerator_logsModeratorAction() {
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("ceoUser")).thenReturn("CEO");
        when(userClient.displayName("author1")).thenReturn("Author");

        postService.deletePost("p1", "ceoUser", List.of("CEO"));

        verify(postRepository).delete(post);
    }

    @Test
    void deletePost_unauthorized_throws() {
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));

        assertThatThrownBy(() -> postService.deletePost("p1", "intruder", List.of()))
                .isInstanceOf(AccessDeniedException.class);
        verify(postRepository, never()).delete(any());
    }

    @Test
    void deletePost_notFound_throws() {
        when(postRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.deletePost("missing", "u1", List.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── authorization edge cases shared by update/pin/delete ──────────────────

    @Test
    void assertCanEdit_departmentManagerViaTeamsDepartment_allowed() {
        Post teamPost = Post.builder().id("p1").authorId("author1").teamId("team1")
                .postType(TypePosts.DISCUSSION).createdAt(LocalDateTime.now()).build();
        PostRequest req = new PostRequest();
        req.setContent("Edited");
        req.setPostType(TypePosts.DISCUSSION);

        when(postRepository.findById("p1")).thenReturn(Optional.of(teamPost));
        when(organizationClient.getDepartmentIdForTeam("team1")).thenReturn("dept1");
        when(organizationClient.isDepartmentManager("dept1", "manager1")).thenReturn(true);
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userClient.displayName("manager1")).thenReturn("Manager");
        stubAttachmentsAndReactionCounts("p1");

        PostResponse response = postService.updatePost("p1", req, "manager1", List.of("DEPARTMENT_LEADER"));

        assertThat(response.getContent()).isEqualTo("Edited");
    }
}
