package tn.moonside.searchservice.repositories;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import tn.moonside.searchservice.documents.DepartmentSearchDocument;

import java.util.List;

public interface DepartmentSearchRepository extends ElasticsearchRepository<DepartmentSearchDocument, String> {

    List<DepartmentSearchDocument> findByNameStartingWithOrDescriptionContaining(String name, String description);
}
