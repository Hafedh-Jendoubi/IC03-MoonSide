package tn.moonside.searchservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.moonside.searchservice.dto.SearchDto;
import tn.moonside.searchservice.service.SearchService;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * GET /search?q=john&size=5
     * Returns matched users, teams, departments, and posts in one shot.
     */
    @GetMapping
    public ResponseEntity<SearchDto.ApiResponse<SearchDto.SearchResult>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "5") int size
    ) {
        if (q == null || q.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(SearchDto.ApiResponse.<SearchDto.SearchResult>builder()
                            .success(false)
                            .message("Query must not be blank")
                            .build());
        }
        SearchDto.SearchResult result = searchService.globalSearch(q.trim(), size);
        return ResponseEntity.ok(SearchDto.ApiResponse.success(result));
    }

    /**
     * Internal index endpoints — called by other microservices directly
     * (or via Kafka consumers inside this service).
     */
    @PostMapping("/internal/index/users")
    public ResponseEntity<Void> indexUser(@RequestBody SearchDto.UserIndexEvent event) {
        searchService.indexUser(event);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/internal/index/teams")
    public ResponseEntity<Void> indexTeam(@RequestBody SearchDto.TeamIndexEvent event) {
        searchService.indexTeam(event);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/internal/index/departments")
    public ResponseEntity<Void> indexDepartment(@RequestBody SearchDto.DepartmentIndexEvent event) {
        searchService.indexDepartment(event);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/internal/index/posts")
    public ResponseEntity<Void> indexPost(@RequestBody SearchDto.PostIndexEvent event) {
        searchService.indexPost(event);
        return ResponseEntity.ok().build();
    }
}
