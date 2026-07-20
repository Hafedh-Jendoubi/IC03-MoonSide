package tn.moonside.searchservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.moonside.searchservice.dtos.ApiResponse;
import tn.moonside.searchservice.dtos.RecordSearchRequest;
import tn.moonside.searchservice.dtos.SearchHistoryItem;
import tn.moonside.searchservice.dtos.SearchResponse;
import tn.moonside.searchservice.services.SearchHistoryService;
import tn.moonside.searchservice.services.SearchService;

import java.util.List;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final SearchHistoryService searchHistoryService;

    /**
     * GET /search?q=...
     * Global search across users, teams, departments, and posts — backs the navbar search bar.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SearchResponse>> search(
            @RequestParam(value = "q", required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(ApiResponse.success(searchService.search(q)));
    }

    /** GET /search/history — this user's recent searches, most recent first. */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SearchHistoryItem>>> getHistory(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(ApiResponse.success(searchHistoryService.getRecentSearches(userId)));
    }

    /** POST /search/history — remembers a search term for this user. */
    @PostMapping("/history")
    public ResponseEntity<ApiResponse<Void>> recordSearch(
            @AuthenticationPrincipal String userId, @RequestBody RecordSearchRequest request) {
        searchHistoryService.recordSearch(userId, request.getQuery());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** DELETE /search/history/{id} — removes a single recent-search entry. */
    @DeleteMapping("/history/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistoryEntry(
            @AuthenticationPrincipal String userId, @PathVariable String id) {
        searchHistoryService.deleteEntry(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** DELETE /search/history — wipes this user's entire search history. */
    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse<Void>> clearHistory(
            @AuthenticationPrincipal String userId) {
        searchHistoryService.clearHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
