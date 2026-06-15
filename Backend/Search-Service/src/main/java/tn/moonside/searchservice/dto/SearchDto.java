package tn.moonside.searchservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class SearchDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResult {
        private List<UserHit> users;
        private List<TeamHit> teams;
        private List<DepartmentHit> departments;
        private List<PostHit> posts;
        private long totalHits;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserHit {
        private String id;
        private String firstName;
        private String lastName;
        private String email;
        private String jobTitle;
        private String avatar;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamHit {
        private String id;
        private String name;
        private String description;
        private String departmentId;
        private String avatarUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentHit {
        private String id;
        private String name;
        private String description;
        private String avatarUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostHit {
        private String id;
        private String content;
        private String authorId;
        private String authorName;
        private String postType;
        private String createdAt;
    }

    // ── Kafka event payloads (ingested from other services) ──────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserIndexEvent {
        private String action; // UPSERT | DELETE
        private String id;
        private String firstName;
        private String lastName;
        private String email;
        private String jobTitle;
        private String avatar;
        private boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamIndexEvent {
        private String action;
        private String id;
        private String name;
        private String description;
        private String departmentId;
        private String avatarUrl;
        private boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentIndexEvent {
        private String action;
        private String id;
        private String name;
        private String description;
        private String avatarUrl;
        private boolean isActive;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostIndexEvent {
        private String action;
        private String id;
        private String content;
        private String authorId;
        private String authorName;
        private String postType;
        private String postVisibility;
        private String createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApiResponse<T> {
        private boolean success;
        private String message;
        private T data;

        public static <T> ApiResponse<T> success(T data) {
            return ApiResponse.<T>builder()
                    .success(true)
                    .message("OK")
                    .data(data)
                    .build();
        }
    }
}
