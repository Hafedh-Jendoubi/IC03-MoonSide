package tn.moonside.searchservice.repository;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import tn.moonside.searchservice.document.UserDocument;

public interface UserSearchRepository extends ElasticsearchRepository<UserDocument, String> {
}
