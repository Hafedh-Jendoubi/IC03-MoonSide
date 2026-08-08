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
import tn.moonside.postservice.dtos.responses.PostResponse;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.entities.SavedPost;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.SavedPostRepository;

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
class SavedPostServiceTest {

    @Mock private SavedPostRepository savedPostRepository;
    @Mock private PostRepository postRepository;
    @Mock private PostService postService;
    @Mock private AuditClient auditClient;
    @Mock private UserClient userClient;

    @InjectMocks
    private SavedPostService savedPostService;

    private Post post;

    @BeforeEach
    void setUp() {
        post = Post.builder().id("p1").authorId("author1").content("hi")
                .createdAt(LocalDateTime.now()).build();
    }

    @Test
    void save_success() {
        when(postRepository.existsById("p1")).thenReturn(true);
        when(savedPostRepository.existsByUserIdAndPostId("u1", "p1")).thenReturn(false);
        when(userClient.displayName("u1")).thenReturn("Alice");
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("author1")).thenReturn("Bob");

        savedPostService.save("p1", "u1");

        verify(savedPostRepository).save(any(SavedPost.class));
        verify(auditClient).log(eq("u1"), eq("p1"), eq("POST"), eq(PostAuditAction.POST_SAVED),
                anyString(), eq(true), any(), any());
    }

    @Test
    void save_postNotFound_throws() {
        when(postRepository.existsById("missing")).thenReturn(false);

        assertThatThrownBy(() -> savedPostService.save("missing", "u1"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(savedPostRepository, never()).save(any());
    }

    @Test
    void save_alreadySaved_throws() {
        when(postRepository.existsById("p1")).thenReturn(true);
        when(savedPostRepository.existsByUserIdAndPostId("u1", "p1")).thenReturn(true);

        assertThatThrownBy(() -> savedPostService.save("p1", "u1"))
                .isInstanceOf(IllegalStateException.class);
        verify(savedPostRepository, never()).save(any());
    }

    @Test
    void save_postDisappearsBeforeAudit_usesFallbackDescription() {
        when(postRepository.existsById("p1")).thenReturn(true);
        when(savedPostRepository.existsByUserIdAndPostId("u1", "p1")).thenReturn(false);
        when(userClient.displayName("u1")).thenReturn("Alice");
        when(postRepository.findById("p1")).thenReturn(Optional.empty());

        savedPostService.save("p1", "u1");

        verify(auditClient).log(eq("u1"), eq("p1"), eq("POST"), eq(PostAuditAction.POST_SAVED),
                eq("Alice bookmarked a post"), eq(true), any(), any());
    }

    @Test
    void unsave_success() {
        when(savedPostRepository.existsByUserIdAndPostId("u1", "p1")).thenReturn(true);
        when(userClient.displayName("u1")).thenReturn("Alice");
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(userClient.displayName("author1")).thenReturn("Bob");

        savedPostService.unsave("p1", "u1");

        verify(savedPostRepository).deleteByUserIdAndPostId("u1", "p1");
        verify(auditClient).log(eq("u1"), eq("p1"), eq("POST"), eq(PostAuditAction.POST_UNSAVED),
                anyString(), eq(true), any(), any());
    }

    @Test
    void unsave_notFound_throws() {
        when(savedPostRepository.existsByUserIdAndPostId("u1", "p1")).thenReturn(false);

        assertThatThrownBy(() -> savedPostService.unsave("p1", "u1"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(savedPostRepository, never()).deleteByUserIdAndPostId(anyString(), anyString());
    }

    @Test
    void getSavedPosts_returnsMappedResponses() {
        SavedPost sp = SavedPost.builder().id("sp1").userId("u1").postId("p1").build();
        PostResponse resp = PostResponse.builder().id("p1").build();

        when(savedPostRepository.findByUserId("u1")).thenReturn(List.of(sp));
        when(postRepository.findById("p1")).thenReturn(Optional.of(post));
        when(postService.getById("p1")).thenReturn(resp);

        List<PostResponse> result = savedPostService.getSavedPosts("u1");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo("p1");
    }

    @Test
    void getSavedPosts_filtersOutMissingPosts() {
        SavedPost sp = SavedPost.builder().id("sp1").userId("u1").postId("missing").build();

        when(savedPostRepository.findByUserId("u1")).thenReturn(List.of(sp));
        when(postRepository.findById("missing")).thenReturn(Optional.empty());

        List<PostResponse> result = savedPostService.getSavedPosts("u1");

        assertThat(result).isEmpty();
        verify(postService, never()).getById(anyString());
    }
}
