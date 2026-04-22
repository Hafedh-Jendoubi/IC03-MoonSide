package tn.moonside.organizationservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.organizationservice.entities.Team;
import tn.moonside.organizationservice.enums.VisibilityType;

import java.util.List;

public interface TeamRepository extends MongoRepository<Team, String> {

    List<Team> findByDepartmentId(String departmentId);

    List<Team> findByTeamVisibility(VisibilityType visibility);

    List<Team> findByLeadId(String leadId);

    List<Team> findByNameContainingIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndDepartmentId(String name, String departmentId);
}
