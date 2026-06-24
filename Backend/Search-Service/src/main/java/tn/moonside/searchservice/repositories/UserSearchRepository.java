package tn.moonside.searchservice.repositories;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import tn.moonside.searchservice.documents.UserSearchDocument;

import java.util.List;

public interface UserSearchRepository extends ElasticsearchRepository<UserSearchDocument, String> {

    /**
     * Matches as the user types: first/last name or email prefix, or any
     * word inside the job title.
     */
    List<UserSearchDocument> findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
            String firstName, String lastName, String email, String jobTitle);
}
