package tn.moonside.searchservice.repositories;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import tn.moonside.searchservice.documents.SearchHistoryDocument;

import java.util.List;

public interface SearchHistoryRepository extends ElasticsearchRepository<SearchHistoryDocument, String> {

    /** All remembered search terms for one user, in no particular order — callers sort by {@code searchedAt}. */
    List<SearchHistoryDocument> findByUserId(String userId);

    /** Wipes every entry for one user (used by "Clear all"). */
    void deleteByUserId(String userId);
}
