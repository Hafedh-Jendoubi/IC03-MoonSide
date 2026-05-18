package tn.moonside.organizationservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.organizationservice.entities.Team;
import tn.moonside.organizationservice.enums.VisibilityType;

import java.util.List;

public interface TeamRepository extends MongoRepository<Team, String> {

    List<Team> findByDepartmentId(String departmentId);

    /** Teams NOT attached to any department. */
    List<Team> findByDepartmentIdIsNull();

    List<Team> findByTeamVisibility(VisibilityType visibility);

    List<Team> findByNameContainingIgnoreCase(String name);

    List<Team> findByLeadId(String leadId);

    boolean existsByNameAndDepartmentId(String name, String departmentId);
}
