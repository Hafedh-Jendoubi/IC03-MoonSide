package tn.moonside.postservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import tn.moonside.postservice.dtos.requests.SurveyVoteRequest;
import tn.moonside.postservice.dtos.responses.ApiResponse;
import tn.moonside.postservice.dtos.responses.SurveyResponse;
import tn.moonside.postservice.services.SurveyService;

@RestController
@RequestMapping("/posts/{postId}/survey")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    /**
     * POST /posts/{postId}/survey/vote
     * Cast or change the authenticated user's vote on a survey post.
     */
    @PostMapping("/vote")
    public ResponseEntity<ApiResponse<SurveyResponse>> vote(
            @PathVariable String postId,
            @Valid @RequestBody SurveyVoteRequest req,
            @AuthenticationPrincipal String userId) {

        SurveyResponse result = surveyService.vote(postId, userId, req.getOptionId());
        return ResponseEntity.ok(ApiResponse.success(result, "Vote recorded"));
    }
}
