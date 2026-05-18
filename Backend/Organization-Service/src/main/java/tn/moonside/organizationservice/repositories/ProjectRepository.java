package tn.moonside.organizationservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.organizationservice.entities.Project;
import tn.moonside.organizationservice.enums.ProjectStatus;

import java.util.List;

public interface ProjectRepository extends MongoRepository<Project, String> {

    /** All projects that have a given team in their teamIds list. */
    List<Project> findByTeamIdsContaining(String teamId);

    List<Project> findByStatus(ProjectStatus status);

    List<Project> findByNameContainingIgnoreCase(String name);
}
