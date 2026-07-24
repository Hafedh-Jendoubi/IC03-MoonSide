package tn.moonside.organizationservice.search;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.AfterDeleteEvent;
import org.springframework.data.mongodb.core.mapping.event.AfterSaveEvent;
import org.springframework.stereotype.Component;
import tn.moonside.organizationservice.entities.Team;
import tn.moonside.organizationservice.enums.VisibilityType;
import tn.moonside.organizationservice.repositories.TeamRepository;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Keeps the Elasticsearch "teams" index in sync with MongoDB — no changes
 * needed anywhere else in the codebase.
 *
 * Only PUBLIC teams are indexed, so global search never surfaces private
 * teams. If a team's visibility changes away from PUBLIC, it's removed
 * from the index on the next save.
 *
 * <ul>
 *   <li>On startup: bulk-indexes every existing PUBLIC team (cheap upsert,
 *       safe to repeat) so search works immediately for pre-existing data.</li>
 *   <li>From then on: every {@code save}/{@code delete} through
 *       {@code TeamRepository} automatically keeps the index up to date.</li>
 * </ul>
 *
 * Indexing is "fire and forget": any Elasticsearch hiccup is logged and
 * swallowed so it can never break a normal team create/update/delete flow.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TeamSearchSyncListener extends AbstractMongoEventListener<Team> implements CommandLineRunner {

    private final ElasticsearchOperations elasticsearchOperations;
    private final TeamRepository teamRepository;

    @Override
    public void run(String... args) {
        try {
            List<TeamSearchDocument> docs = teamRepository.findAll().stream()
                    .filter(t -> t.getTeamVisibility() == VisibilityType.PUBLIC)
                    .map(this::toDocument)
                    .collect(Collectors.toList());
            if (!docs.isEmpty()) {
                elasticsearchOperations.save(docs);
                log.info("Search index: bulk-indexed {} public teams into Elasticsearch", docs.size());
            }
        } catch (Exception e) {
            log.warn("Search index: could not bulk-index teams on startup ({}). " +
                    "Elasticsearch may still be starting up — sync will resume on the next save.", e.getMessage());
        }
    }

    @Override
    public void onAfterSave(AfterSaveEvent<Team> event) {
        Team team = event.getSource();
        try {
            if (team.getTeamVisibility() == VisibilityType.PUBLIC) {
                elasticsearchOperations.save(toDocument(team));
            } else {
                elasticsearchOperations.delete(team.getId(), TeamSearchDocument.class);
            }
        } catch (Exception e) {
            log.warn("Search index: failed to index team {}: {}", team.getId(), e.getMessage());
        }
    }

    @Override
    public void onAfterDelete(AfterDeleteEvent<Team> event) {
        Object id = event.getDocument() != null ? event.getDocument().get("_id") : null;
        if (id == null) return;
        try {
            elasticsearchOperations.delete(id.toString(), TeamSearchDocument.class);
        } catch (Exception e) {
            log.warn("Search index: failed to remove team {}: {}", id, e.getMessage());
        }
    }

    private TeamSearchDocument toDocument(Team team) {
        return TeamSearchDocument.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .avatarUrl(team.getAvatarUrl())
                .build();
    }
}
