package tn.moonside.organizationservice.search;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.AfterDeleteEvent;
import org.springframework.data.mongodb.core.mapping.event.AfterSaveEvent;
import org.springframework.stereotype.Component;
import tn.moonside.organizationservice.entities.Department;
import tn.moonside.organizationservice.repositories.DepartmentRepository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Keeps the Elasticsearch "departments" index in sync with MongoDB — no
 * changes needed anywhere else in the codebase.
 *
 * Only ACTIVE departments are indexed. If a department's active flag
 * changes to false, it's removed from the index on the next save.
 *
 * <ul>
 *   <li>On startup: bulk-indexes every existing ACTIVE department (cheap
 *       upsert, safe to repeat) so search works immediately for
 *       pre-existing data.</li>
 *   <li>From then on: every {@code save}/{@code delete} through
 *       {@code DepartmentRepository} automatically keeps the index up to date.</li>
 * </ul>
 *
 * Indexing is "fire and forget": any Elasticsearch hiccup is logged and
 * swallowed so it can never break a normal department create/update/delete flow.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DepartmentSearchSyncListener extends AbstractMongoEventListener<Department> implements CommandLineRunner {

    private final ElasticsearchOperations elasticsearchOperations;
    private final DepartmentRepository departmentRepository;

    @Override
    public void run(String... args) {
        try {
            List<DepartmentSearchDocument> docs = departmentRepository.findAll().stream()
                    .filter(Department::isActive)
                    .map(this::toDocument)
                    .collect(Collectors.toList());
            if (!docs.isEmpty()) {
                elasticsearchOperations.save(docs);
                log.info("Search index: bulk-indexed {} active departments into Elasticsearch", docs.size());
            }
        } catch (Exception e) {
            log.warn("Search index: could not bulk-index departments on startup ({}). " +
                    "Elasticsearch may still be starting up — sync will resume on the next save.", e.getMessage());
        }
    }

    @Override
    public void onAfterSave(AfterSaveEvent<Department> event) {
        Department department = event.getSource();
        try {
            if (department.isActive()) {
                elasticsearchOperations.save(toDocument(department));
            } else {
                elasticsearchOperations.delete(department.getId(), DepartmentSearchDocument.class);
            }
        } catch (Exception e) {
            log.warn("Search index: failed to index department {}: {}", department.getId(), e.getMessage());
        }
    }

    @Override
    public void onAfterDelete(AfterDeleteEvent<Department> event) {
        Object id = event.getDocument() != null ? event.getDocument().get("_id") : null;
        if (id == null) return;
        try {
            elasticsearchOperations.delete(id.toString(), DepartmentSearchDocument.class);
        } catch (Exception e) {
            log.warn("Search index: failed to remove department {}: {}", id, e.getMessage());
        }
    }

    private DepartmentSearchDocument toDocument(Department department) {
        return DepartmentSearchDocument.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .avatarUrl(department.getAvatarUrl())
                .build();
    }
}
