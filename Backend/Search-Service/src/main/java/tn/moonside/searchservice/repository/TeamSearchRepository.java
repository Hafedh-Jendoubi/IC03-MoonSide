package tn.moonside.searchservice.repository;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import tn.moonside.searchservice.document.TeamDocument;

public interface TeamSearchRepository extends ElasticsearchRepository<TeamDocument, String> {
}
