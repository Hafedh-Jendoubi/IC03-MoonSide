package tn.moonside.organizationservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tn.moonside.organizationservice.entities.Department;
import tn.moonside.organizationservice.entities.Team;

import java.util.Map;

/**
 * Publishes team and department UPSERT / DELETE events so the Search
 * Service keeps its Elasticsearch indices current.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SearchIndexPublisher {

    private static final String TEAM_TOPIC = "search.index.teams";
    private static final String DEPT_TOPIC  = "search.index.departments";

    private final KafkaTemplate<String, Object> kafkaTemplate;

    // ── Teams ────────────────────────────────────────────────────────────────

    public void publishTeamUpsert(Team team) {
        try {
            Map<String, Object> event = Map.of(
                    "action", "UPSERT",
                    "id", team.getId(),
                    "name", team.getName() != null ? team.getName() : "",
                    "description", team.getDescription() != null ? team.getDescription() : "",
                    "departmentId", team.getDepartmentId() != null ? team.getDepartmentId() : "",
                    "avatarUrl", team.getAvatarUrl() != null ? team.getAvatarUrl() : "",
                    "isActive", true
            );
            kafkaTemplate.send(TEAM_TOPIC, team.getId(), event);
        } catch (Exception e) {
            log.warn("Could not publish search index event for team {}: {}", team.getId(), e.getMessage());
        }
    }

    public void publishTeamDelete(String teamId) {
        try {
            kafkaTemplate.send(TEAM_TOPIC, teamId, Map.of("action", "DELETE", "id", teamId));
        } catch (Exception e) {
            log.warn("Could not publish delete event for team {}: {}", teamId, e.getMessage());
        }
    }

    // ── Departments ──────────────────────────────────────────────────────────

    public void publishDepartmentUpsert(Department dept) {
        try {
            Map<String, Object> event = Map.of(
                    "action", "UPSERT",
                    "id", dept.getId(),
                    "name", dept.getName() != null ? dept.getName() : "",
                    "description", dept.getDescription() != null ? dept.getDescription() : "",
                    "avatarUrl", dept.getAvatarUrl() != null ? dept.getAvatarUrl() : "",
                    "isActive", dept.isActive()
            );
            kafkaTemplate.send(DEPT_TOPIC, dept.getId(), event);
        } catch (Exception e) {
            log.warn("Could not publish search index event for department {}: {}", dept.getId(), e.getMessage());
        }
    }

    public void publishDepartmentDelete(String deptId) {
        try {
            kafkaTemplate.send(DEPT_TOPIC, deptId, Map.of("action", "DELETE", "id", deptId));
        } catch (Exception e) {
            log.warn("Could not publish delete event for department {}: {}", deptId, e.getMessage());
        }
    }
}
