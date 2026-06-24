package tn.moonside.searchservice.services;

import tn.moonside.searchservice.dtos.SearchHistoryItem;

import java.util.List;

public interface SearchHistoryService {

    /** Returns this user's recent searches, most recent first. */
    List<SearchHistoryItem> getRecentSearches(String userId);

    /**
     * Remembers a search term for this user. Re-recording a term that's
     * already in their history just bumps it back to the top with a fresh
     * timestamp instead of creating a duplicate entry.
     */
    void recordSearch(String userId, String query);

    /** Removes a single entry, scoped to its owner (no-ops if not found or not owned). */
    void deleteEntry(String userId, String id);

    /** Wipes this user's entire search history. */
    void clearHistory(String userId);
}
