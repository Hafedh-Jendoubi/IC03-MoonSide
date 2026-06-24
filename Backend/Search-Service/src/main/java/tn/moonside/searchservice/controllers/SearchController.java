package tn.moonside.searchservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.moonside.searchservice.dtos.ApiResponse;
import tn.moonside.searchservice.dtos.SearchResponse;
import tn.moonside.searchservice.services.SearchService;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * GET /search?q=...
     * Global search across users, teams, and posts — backs the navbar search bar.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SearchResponse>> search(
            @RequestParam(value = "q", required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(ApiResponse.success(searchService.search(q)));
    }
}
