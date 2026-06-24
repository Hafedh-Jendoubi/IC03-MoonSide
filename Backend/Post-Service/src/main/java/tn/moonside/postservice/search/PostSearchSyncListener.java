package tn.moonside.postservice.search;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.AfterDeleteEvent;
import org.springframework.data.mongodb.core.mapping.event.AfterSaveEvent;
import org.springframework.stereotype.Component;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.enums.VisibilityType;
import tn.moonside.postservice.repositories.PostRepository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Keeps the Elasticsearch "posts" index in sync with MongoDB — no changes
 * needed anywhere else in the codebase.
 *
 * Only PUBLIC posts are indexed, so global search never surfaces private,
 * team-only, department-only, or draft content. If a post's visibility
 * changes away from PUBLIC, it's removed from the index on the next save.
 *
 * <ul>
 *   <li>On startup: bulk-indexes every existing PUBLIC post (cheap upsert,
 *       safe to repeat) so search works immediately for pre-existing data.</li>
 *   <li>From then on: every {@code save}/{@code delete} through
 *       {@code PostRepository} automatically keeps the index up to date.</li>
 * </ul>
 *
 * Indexing is "fire and forget": any Elasticsearch hiccup is logged and
 * swallowed so it can never break a normal post create/update/delete flow.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PostSearchSyncListener extends AbstractMongoEventListener<Post> implements CommandLineRunner {

    private final ElasticsearchOperations elasticsearchOperations;
    private final PostRepository postRepository;

    @Override
    public void run(String... args) {
        try {
            List<PostSearchDocument> docs = postRepository.findAll().stream()
                    .filter(p -> p.getPostVisibility() == VisibilityType.PUBLIC)
                    .map(this::toDocument)
                    .collect(Collectors.toList());
            if (!docs.isEmpty()) {
                elasticsearchOperations.save(docs);
                log.info("Search index: bulk-indexed {} public posts into Elasticsearch", docs.size());
            }
        } catch (Exception e) {
            log.warn("Search index: could not bulk-index posts on startup ({}). " +
                    "Elasticsearch may still be starting up — sync will resume on the next save.", e.getMessage());
        }
    }

    @Override
    public void onAfterSave(AfterSaveEvent<Post> event) {
        Post post = event.getSource();
        try {
            if (post.getPostVisibility() == VisibilityType.PUBLIC) {
                elasticsearchOperations.save(toDocument(post));
            } else {
                // Visibility may have just changed away from PUBLIC — make sure
                // it's no longer searchable. Harmless no-op if it was never indexed.
                elasticsearchOperations.delete(post.getId(), PostSearchDocument.class);
            }
        } catch (Exception e) {
            log.warn("Search index: failed to index post {}: {}", post.getId(), e.getMessage());
        }
    }

    @Override
    public void onAfterDelete(AfterDeleteEvent<Post> event) {
        Object id = event.getDocument() != null ? event.getDocument().get("_id") : null;
        if (id == null) return;
        try {
            elasticsearchOperations.delete(id.toString(), PostSearchDocument.class);
        } catch (Exception e) {
            log.warn("Search index: failed to remove post {}: {}", id, e.getMessage());
        }
    }

    private PostSearchDocument toDocument(Post post) {
        return PostSearchDocument.builder()
                .id(post.getId())
                .content(post.getContent())
                .authorId(post.getAuthorId())
                .teamId(post.getTeamId())
                .postType(post.getPostType() != null ? post.getPostType().name() : null)
                .createdAt(post.getCreatedAt() != null ? post.getCreatedAt().toString() : null)
                .build();
    }
}
