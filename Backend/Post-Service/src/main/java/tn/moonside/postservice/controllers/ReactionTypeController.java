package tn.moonside.postservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.moonside.postservice.dtos.requests.ReactionTypeRequest;
import tn.moonside.postservice.dtos.responses.ApiResponse;
import tn.moonside.postservice.dtos.responses.ReactionTypeResponse;
import tn.moonside.postservice.services.ReactionTypeService;

import java.util.List;

@RestController
@RequestMapping("/reaction-types")
@RequiredArgsConstructor
public class ReactionTypeController {

    private final ReactionTypeService reactionTypeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReactionTypeResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(reactionTypeService.getAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<ApiResponse<ReactionTypeResponse>> create(
            @Valid @RequestBody ReactionTypeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(reactionTypeService.create(req), "Reaction type created"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CEO')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        reactionTypeService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Reaction type deleted"));
    }
}
