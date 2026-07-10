package tn.moonside.postservice.dtos.responses;

import lombok.*;

import java.util.List;

/**
 * Aggregated statistics for the admin back-office dashboard.
 * All figures are computed live from the posts/comments/reactions collections.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostStatsResponse {

    private long totalPosts;
    private long totalComments;
    private long totalReactions;

    private long postsToday;
    private long commentsToday;
    private long reactionsToday;

    private double avgCommentsPerPost;
    private double avgReactionsPerPost;

    /** Posts created per day, oldest → newest (last 14 days). */
    private List<DailyCount> postsPerDay;

    /** Comments created per day, oldest → newest (last 14 days). */
    private List<DailyCount> commentsPerDay;

    /** Reactions created per day, oldest → newest (last 14 days). */
    private List<DailyCount> reactionsPerDay;

    /**
     * Combined posts + comments + reactions activity bucketed by hour of day (0-23),
     * computed over the last 30 days. This is the "hours of activity on the website" chart.
     */
    private List<HourlyCount> activityByHour;

    /** Breakdown of posts by TypePosts enum (DISCUSSION, ANNOUNCEMENT, ...). */
    private List<NamedCount> postsByType;

    /** Breakdown of reactions by reaction type (emoji code). */
    private List<ReactionBreakdown> reactionsByType;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyCount {
        private String date; // yyyy-MM-dd
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourlyCount {
        private int hour; // 0-23
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NamedCount {
        private String name;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReactionBreakdown {
        private String code;
        private String emoji;
        private String name;
        private long count;
    }
}
