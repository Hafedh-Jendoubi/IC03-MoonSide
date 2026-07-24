package tn.moonside.searchservice.repositories;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import tn.moonside.searchservice.documents.TeamSearchDocument;

import java.util.List;

public interface TeamSearchRepository extends ElasticsearchRepository<TeamSearchDocument, String> {

    List<TeamSearchDocument> findByNameStartingWithOrDescriptionContaining(String name, String description);
}
