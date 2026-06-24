package tn.moonside.searchservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.moonside.searchservice.documents.SearchHistoryDocument;
import tn.moonside.searchservice.dtos.SearchHistoryItem;
import tn.moonside.searchservice.repositories.SearchHistoryRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchHistoryServiceImpl implements SearchHistoryService {

    /** Just enough for a handy dropdown — this is a "recent searches" shortcut, not an audit log. */
    private static final int MAX_HISTORY_PER_USER = 8;

    /** Mirrors the frontend's minimum search length so we never store junk like a single letter. */
    private static final int MIN_QUERY_LENGTH = 2;

    private final SearchHistoryRepository searchHistoryRepository;

    @Override
    public List<SearchHistoryItem> getRecentSearches(String userId) {
        return searchHistoryRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(SearchHistoryDocument::getSearchedAt).reversed())
                .limit(MAX_HISTORY_PER_USER)
                .map(this::toItem)
                .collect(Collectors.toList());
    }

    @Override
    public void recordSearch(String userId, String query) {
        String trimmed = query == null ? "" : query.trim();
        if (trimmed.length() < MIN_QUERY_LENGTH) return;

        List<SearchHistoryDocument> existing = searchHistoryRepository.findByUserId(userId);

        // Re-running a search just refreshes its position instead of piling
        // up duplicate entries for the same term.
        List<SearchHistoryDocument> others = new ArrayList<>();
        for (SearchHistoryDocument doc : existing) {
            if (doc.getQuery().equalsIgnoreCase(trimmed)) {
                searchHistoryRepository.delete(doc);
            } else {
                others.add(doc);
            }
        }

        searchHistoryRepository.save(SearchHistoryDocument.builder()
                .id(UUID.randomUUID().toString())
                .userId(userId)
                .query(trimmed)
                .searchedAt(Instant.now().toString())
                .build());

        // Keep the list bounded so it stays "recent", not ever-growing.
        others.sort(Comparator.comparing(SearchHistoryDocument::getSearchedAt).reversed());
        if (others.size() >= MAX_HISTORY_PER_USER) {
            others.subList(MAX_HISTORY_PER_USER - 1, others.size())
                    .forEach(searchHistoryRepository::delete);
        }
    }

    @Override
    public void deleteEntry(String userId, String id) {
        searchHistoryRepository.findById(id).ifPresent(doc -> {
            if (doc.getUserId().equals(userId)) {
                searchHistoryRepository.deleteById(id);
            }
        });
    }

    @Override
    public void clearHistory(String userId) {
        searchHistoryRepository.deleteByUserId(userId);
    }

    private SearchHistoryItem toItem(SearchHistoryDocument doc) {
        return SearchHistoryItem.builder()
                .id(doc.getId())
                .query(doc.getQuery())
                .searchedAt(doc.getSearchedAt())
                .build();
    }
}
