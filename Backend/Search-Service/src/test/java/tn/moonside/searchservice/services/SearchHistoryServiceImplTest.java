package tn.moonside.searchservice.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.searchservice.documents.SearchHistoryDocument;
import tn.moonside.searchservice.dtos.SearchHistoryItem;
import tn.moonside.searchservice.repositories.SearchHistoryRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchHistoryServiceImplTest {

    @Mock
    private SearchHistoryRepository searchHistoryRepository;

    @InjectMocks
    private SearchHistoryServiceImpl searchHistoryService;

    private SearchHistoryDocument doc(String id, String userId, String query, String searchedAt) {
        return SearchHistoryDocument.builder()
                .id(id).userId(userId).query(query).searchedAt(searchedAt).build();
    }

    // ── getRecentSearches ────────────────────────────────────────────────────

    @Test
    void getRecentSearches_sortsMostRecentFirstAndLimitsToEight() {
        List<SearchHistoryDocument> docs = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            docs.add(doc("h" + i, "user1", "query" + i, "2026-01-01T00:00:0" + (i < 10 ? i : 9) + "Z"));
        }
        when(searchHistoryRepository.findByUserId("user1")).thenReturn(docs);

        List<SearchHistoryItem> result = searchHistoryService.getRecentSearches("user1");

        assertThat(result).hasSize(8);
        // Most recent (highest index / timestamp) should come first.
        assertThat(result.get(0).getQuery()).isEqualTo("query9");
        assertThat(result.get(1).getQuery()).isEqualTo("query8");
    }

    @Test
    void getRecentSearches_noHistory_returnsEmptyList() {
        when(searchHistoryRepository.findByUserId("user1")).thenReturn(List.of());

        List<SearchHistoryItem> result = searchHistoryService.getRecentSearches("user1");

        assertThat(result).isEmpty();
    }

    // ── recordSearch ─────────────────────────────────────────────────────────

    @Test
    void recordSearch_queryTooShort_doesNothing() {
        searchHistoryService.recordSearch("user1", "a");

        verifyNoInteractions(searchHistoryRepository);
    }

    @Test
    void recordSearch_nullQuery_doesNothing() {
        searchHistoryService.recordSearch("user1", null);

        verifyNoInteractions(searchHistoryRepository);
    }

    @Test
    void recordSearch_blankQuery_doesNothing() {
        searchHistoryService.recordSearch("user1", "   ");

        verifyNoInteractions(searchHistoryRepository);
    }

    @Test
    void recordSearch_newQuery_savesEntry() {
        when(searchHistoryRepository.findByUserId("user1")).thenReturn(List.of());

        searchHistoryService.recordSearch("user1", "  hello  ");

        ArgumentCaptor<SearchHistoryDocument> captor = ArgumentCaptor.forClass(SearchHistoryDocument.class);
        verify(searchHistoryRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo("user1");
        assertThat(captor.getValue().getQuery()).isEqualTo("hello");
    }

    @Test
    void recordSearch_duplicateQueryCaseInsensitive_deletesOldEntryAndSavesNew() {
        SearchHistoryDocument existing = doc("h1", "user1", "Hello", "2026-01-01T00:00:00Z");
        when(searchHistoryRepository.findByUserId("user1")).thenReturn(List.of(existing));

        searchHistoryService.recordSearch("user1", "hello");

        verify(searchHistoryRepository).delete(existing);
        verify(searchHistoryRepository).save(any(SearchHistoryDocument.class));
    }

    @Test
    void recordSearch_distinctExistingQuery_isNotDeleted() {
        SearchHistoryDocument existing = doc("h1", "user1", "other query", "2026-01-01T00:00:00Z");
        when(searchHistoryRepository.findByUserId("user1")).thenReturn(List.of(existing));

        searchHistoryService.recordSearch("user1", "hello");

        verify(searchHistoryRepository, never()).delete(existing);
        verify(searchHistoryRepository).save(any(SearchHistoryDocument.class));
    }

    @Test
    void recordSearch_historyAtLimit_deletesOldestEntries() {
        // 8 distinct (non-matching) existing entries, oldest to newest.
        List<SearchHistoryDocument> existing = new ArrayList<>();
        for (int i = 0; i < 8; i++) {
            existing.add(doc("h" + i, "user1", "query" + i, "2026-01-01T00:00:0" + i + "Z"));
        }
        when(searchHistoryRepository.findByUserId("user1")).thenReturn(existing);

        searchHistoryService.recordSearch("user1", "new search");

        // The oldest entry (query0, lowest timestamp) should be trimmed to keep the list bounded.
        verify(searchHistoryRepository).delete(existing.get(0));
        verify(searchHistoryRepository).save(any(SearchHistoryDocument.class));
    }

    // ── deleteEntry ──────────────────────────────────────────────────────────

    @Test
    void deleteEntry_ownedByUser_deletesById() {
        SearchHistoryDocument existing = doc("h1", "user1", "hello", "2026-01-01T00:00:00Z");
        when(searchHistoryRepository.findById("h1")).thenReturn(Optional.of(existing));

        searchHistoryService.deleteEntry("user1", "h1");

        verify(searchHistoryRepository).deleteById("h1");
    }

    @Test
    void deleteEntry_notOwnedByUser_doesNotDelete() {
        SearchHistoryDocument existing = doc("h1", "otherUser", "hello", "2026-01-01T00:00:00Z");
        when(searchHistoryRepository.findById("h1")).thenReturn(Optional.of(existing));

        searchHistoryService.deleteEntry("user1", "h1");

        verify(searchHistoryRepository, never()).deleteById(any());
    }

    @Test
    void deleteEntry_notFound_doesNothing() {
        when(searchHistoryRepository.findById("missing")).thenReturn(Optional.empty());

        searchHistoryService.deleteEntry("user1", "missing");

        verify(searchHistoryRepository, never()).deleteById(any());
    }

    // ── clearHistory ─────────────────────────────────────────────────────────

    @Test
    void clearHistory_delegatesToRepository() {
        searchHistoryService.clearHistory("user1");

        verify(searchHistoryRepository).deleteByUserId("user1");
    }
}
