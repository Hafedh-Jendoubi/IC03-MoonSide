package tn.moonside.searchservice.repository;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import tn.moonside.searchservice.document.DepartmentDocument;

public interface DepartmentSearchRepository extends ElasticsearchRepository<DepartmentDocument, String> {
}
