package tn.moonside.searchservice.repository;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import tn.moonside.searchservice.document.PostDocument;

public interface PostSearchRepository extends ElasticsearchRepository<PostDocument, String> {
}
