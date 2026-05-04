package tn.moonside.organizationservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.organizationservice.entities.Department;

import java.util.List;

public interface DepartmentRepository extends MongoRepository<Department, String> {

    List<Department> findByIsActiveTrue();

    boolean existsByNameIgnoreCase(String name);

    List<Department> findByManagerId(String managerId);
}
