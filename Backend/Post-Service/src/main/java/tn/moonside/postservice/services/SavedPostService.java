package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.audit.AuditClient;
import tn.moonside.postservice.audit.PostAuditAction;
import tn.moonside.postservice.clients.UserClient;
import tn.moonside.postservice.entities.Post;
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
    private final UserClient userClient;

    public void save(String postId, String userId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found: " + postId);
        }
        if (savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new IllegalStateException("Post already saved");
        }
        savedPostRepository.save(SavedPost.builder().userId(userId).postId(postId).build());

        String saverName = userClient.displayName(userId);
        String savedPostDesc = postRepository.findById(postId).map(p -> {
            String postAuthorName = userClient.displayName(p.getAuthorId());
            String date = p.getCreatedAt()
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            return saverName + " bookmarked a post by " + postAuthorName + " (posted " + date + ")";
        }).orElse(saverName + " bookmarked a post");
        auditClient.log(userId, postId, "POST", PostAuditAction.POST_SAVED,
                savedPostDesc,
                true, null, null);
    }

    public void unsave(String postId, String userId) {
        if (!savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new IllegalArgumentException("Saved post not found");
        }
        savedPostRepository.deleteByUserIdAndPostId(userId, postId);

        String unsaverName = userClient.displayName(userId);
        String unsavedPostDesc = postRepository.findById(postId).map(p -> {
            String postAuthorName = userClient.displayName(p.getAuthorId());
            return unsaverName + " removed a bookmark on a post by " + postAuthorName;
        }).orElse(unsaverName + " removed a bookmark");
        auditClient.log(userId, postId, "POST", PostAuditAction.POST_UNSAVED,
                unsavedPostDesc,
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
