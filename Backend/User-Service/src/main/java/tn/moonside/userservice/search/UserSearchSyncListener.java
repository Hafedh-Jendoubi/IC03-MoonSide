package tn.moonside.userservice.search;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.AfterDeleteEvent;
import org.springframework.data.mongodb.core.mapping.event.AfterSaveEvent;
import org.springframework.stereotype.Component;
import tn.moonside.userservice.entities.User;
import tn.moonside.userservice.repositories.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Keeps the Elasticsearch "users" index in sync with MongoDB — no changes
 * needed anywhere else in the codebase.
 *
 * <ul>
 *   <li>On startup: bulk-indexes every existing user (cheap upsert, safe to repeat
 *       on every restart) so search works immediately, even for data that
 *       already existed before this feature was added.</li>
 *   <li>From then on: every {@code save}/{@code delete} through
 *       {@code UserRepository} automatically keeps the index up to date.</li>
 * </ul>
 *
 * Indexing is "fire and forget": any Elasticsearch hiccup is logged and
 * swallowed so it can never break a normal user create/update/delete flow.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserSearchSyncListener extends AbstractMongoEventListener<User> implements CommandLineRunner {

    private final ElasticsearchOperations elasticsearchOperations;
    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        try {
            List<UserSearchDocument> docs = userRepository.findAll().stream()
                    .map(this::toDocument)
                    .collect(Collectors.toList());
            if (!docs.isEmpty()) {
                elasticsearchOperations.save(docs);
                log.info("Search index: bulk-indexed {} users into Elasticsearch", docs.size());
            }
        } catch (Exception e) {
            log.warn("Search index: could not bulk-index users on startup ({}). " +
                    "Elasticsearch may still be starting up — sync will resume on the next save.", e.getMessage());
        }
    }

    @Override
    public void onAfterSave(AfterSaveEvent<User> event) {
        User user = event.getSource();
        try {
            elasticsearchOperations.save(toDocument(user));
        } catch (Exception e) {
            log.warn("Search index: failed to index user {}: {}", user.getId(), e.getMessage());
        }
    }

    @Override
    public void onAfterDelete(AfterDeleteEvent<User> event) {
        Object id = event.getDocument() != null ? event.getDocument().get("_id") : null;
        if (id == null) return;
        try {
            elasticsearchOperations.delete(id.toString(), UserSearchDocument.class);
        } catch (Exception e) {
            log.warn("Search index: failed to remove user {}: {}", id, e.getMessage());
        }
    }

    private UserSearchDocument toDocument(User user) {
        return UserSearchDocument.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .jobTitle(user.getJobTitle())
                .avatar(user.getAvatar())
                .active(user.isActive())
                .build();
    }
}
