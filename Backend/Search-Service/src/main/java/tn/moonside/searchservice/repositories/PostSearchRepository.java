package tn.moonside.searchservice.repositories;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import tn.moonside.searchservice.documents.PostSearchDocument;

import java.util.List;

public interface PostSearchRepository extends ElasticsearchRepository<PostSearchDocument, String> {

    List<PostSearchDocument> findByContentContaining(String content);
}
