package tn.moonside.userservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.moonside.userservice.dtos.responses.ApiResponse;
import tn.moonside.userservice.dtos.responses.ConnectionResponse;
import tn.moonside.userservice.dtos.responses.ConnectionStatusResponse;
import tn.moonside.userservice.dtos.responses.UserSummaryResponse;
import tn.moonside.userservice.security.UserDetailsServiceImpl;
import tn.moonside.userservice.services.ConnectionService;

import java.util.List;
import java.util.Map;

/**
 * Connection requests between users — the "Connect" feature on profile pages.
 *
 * No {@code @RequiresPermission} guard is used here: any authenticated
 * employee can send/accept/decline connection requests, the same way any
 * employee can comment or react to a post.
 */
@RestController
@RequestMapping("/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    /** POST /connections/request/{userId} — send a connection request to {userId}. */
    @PostMapping("/request/{userId}")
    public ResponseEntity<ApiResponse<ConnectionResponse>> sendRequest(
            @PathVariable String userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String currentUserId = currentUserId(userDetails);
        ConnectionResponse response = connectionService.sendRequest(currentUserId, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Connection request sent"));
    }

    /** POST /connections/{connectionId}/accept — accept a pending request you received. */
    @PostMapping("/{connectionId}/accept")
    public ResponseEntity<ApiResponse<ConnectionResponse>> accept(
            @PathVariable String connectionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        ConnectionResponse response = connectionService.acceptRequest(connectionId, currentUserId(userDetails));
        return ResponseEntity.ok(ApiResponse.success(response, "Connection accepted"));
    }

    /** POST /connections/{connectionId}/decline — decline a pending request you received. */
    @PostMapping("/{connectionId}/decline")
    public ResponseEntity<ApiResponse<Void>> decline(
            @PathVariable String connectionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        connectionService.declineOrCancel(connectionId, currentUserId(userDetails));
        return ResponseEntity.ok(ApiResponse.success(null, "Connection request declined"));
    }

    /** DELETE /connections/{connectionId} — cancel a pending request you sent, or remove an existing connection. */
    @DeleteMapping("/{connectionId}")
    public ResponseEntity<ApiResponse<Void>> cancelOrRemove(
            @PathVariable String connectionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String currentUserId = currentUserId(userDetails);
        connectionService.removeConnection(connectionId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(null, "Connection removed"));
    }

    /** GET /connections/me — list of all your accepted connections. */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> myConnections(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                connectionService.getConnections(currentUserId(userDetails))));
    }

    /** GET /connections/me/pending — requests received, awaiting your decision. */
    @GetMapping("/me/pending")
    public ResponseEntity<ApiResponse<List<ConnectionResponse>>> pendingReceived(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                connectionService.getPendingReceived(currentUserId(userDetails))));
    }

    /** GET /connections/me/sent — requests you sent, awaiting the other person's decision. */
    @GetMapping("/me/sent")
    public ResponseEntity<ApiResponse<List<ConnectionResponse>>> pendingSent(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                connectionService.getPendingSent(currentUserId(userDetails))));
    }

    /** GET /connections/user/{userId} — list of accepted connections for any user (profile page modal). */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> userConnections(
            @PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(connectionService.getConnections(userId)));
    }

    /** GET /connections/count/{userId} — connection count shown on a profile page. */
    @GetMapping("/count/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Long>>> count(@PathVariable String userId) {
        long count = connectionService.getConnectionCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    /** GET /connections/status/{userId} — relationship between you and {userId}. */
    @GetMapping("/status/{userId}")
    public ResponseEntity<ApiResponse<ConnectionStatusResponse>> status(
            @PathVariable String userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(
                connectionService.getStatus(currentUserId(userDetails), userId)));
    }

    // ── Internal service-to-service endpoint ───────────────────────────────────

    /**
     * GET /connections/internal/{userId}/ids
     * Called by Post-Service to build the "connections" feed. Only requires a
     * valid JWT (any authenticated user/service) — no special permission.
     */
    @GetMapping("/internal/{userId}/ids")
    public ResponseEntity<ApiResponse<List<String>>> connectionIdsInternal(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.success(connectionService.getConnectionIds(userId)));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String currentUserId(UserDetails userDetails) {
        if (userDetails instanceof UserDetailsServiceImpl.CustomUserDetails cud) {
            return cud.getUserId();
        }
        throw new IllegalStateException("Unexpected principal type");
    }
}
