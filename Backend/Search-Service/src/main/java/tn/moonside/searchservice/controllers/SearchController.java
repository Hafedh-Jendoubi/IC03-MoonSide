package tn.moonside.searchservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
     * Global search across users, teams, and posts — backs the navbar search bar.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SearchResponse>> search(
            @RequestParam(value = "q", required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(ApiResponse.success(searchService.search(q)));
    }

    /**
     * GET /search/history
     * This user's recent search terms, most recent first. The principal's
     * name is the user's id — see JwtAuthenticationFilter.
     */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SearchHistoryItem>>> getHistory(Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(searchHistoryService.getRecentSearches(authentication.getName())));
    }

    /**
     * POST /search/history
     * Remembers a search term the user just ran (on submit or on picking a result).
     */
    @PostMapping("/history")
    public ResponseEntity<ApiResponse<Void>> addHistoryEntry(
            Authentication authentication, @RequestBody RecordSearchRequest request) {
        searchHistoryService.recordSearch(authentication.getName(), request.getQuery());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * DELETE /search/history/{id}
     * Removes a single remembered term.
     */
    @DeleteMapping("/history/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistoryEntry(
            Authentication authentication, @PathVariable String id) {
        searchHistoryService.deleteEntry(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * DELETE /search/history
     * Clears this user's entire search history.
     */
    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse<Void>> clearHistory(Authentication authentication) {
        searchHistoryService.clearHistory(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
