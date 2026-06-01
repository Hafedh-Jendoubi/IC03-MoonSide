package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.audit.AuditClient;
import tn.moonside.postservice.audit.PostAuditAction;
import tn.moonside.postservice.dtos.responses.PostResponse;
import tn.moonside.postservice.entities.SavedPost;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.SavedPostRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavedPostService {

    private final SavedPostRepository savedPostRepository;
    private final PostRepository postRepository;
    private final PostService postService;
    private final AuditClient auditClient;

    public void save(String postId, String userId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found: " + postId);
        }
        if (savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new IllegalStateException("Post already saved");
        }
        savedPostRepository.save(SavedPost.builder().userId(userId).postId(postId).build());

        auditClient.log(userId, postId, "POST", PostAuditAction.POST_SAVED,
                "Post '" + postId + "' saved by user '" + userId + "'",
                true, null, null);
    }

    public void unsave(String postId, String userId) {
        if (!savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new IllegalArgumentException("Saved post not found");
        }
        savedPostRepository.deleteByUserIdAndPostId(userId, postId);

        auditClient.log(userId, postId, "POST", PostAuditAction.POST_UNSAVED,
                "Post '" + postId + "' unsaved by user '" + userId + "'",
                true, null, null);
    }

    public List<PostResponse> getSavedPosts(String userId) {
        return savedPostRepository.findByUserId(userId).stream()
                .map(sp -> postRepository.findById(sp.getPostId()).orElse(null))
                .filter(p -> p != null)
                .map(p -> postService.getById(p.getId()))
                .toList();
    }
}
