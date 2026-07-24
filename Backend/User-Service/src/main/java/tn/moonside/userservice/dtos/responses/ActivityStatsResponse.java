package tn.moonside.userservice.dtos.responses;

import lombok.*;

import java.util.List;

/**
 * Real "hours of activity on the website" and related audit-log-derived stats
 * for the admin back-office dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityStatsResponse {

    /** All audit events (logins, edits, etc.) bucketed by hour of day (0-23), last 30 days. */
    private List<HourlyCount> activityByHour;

    /** Successful logins per day, oldest → newest (last 14 days). */
    private List<DailyCount> loginsPerDay;

    /** Top actions recorded in the audit log (LOGIN_SUCCESS, PROFILE_UPDATE, ...). */
    private List<NamedCount> topActions;

    private long totalEventsLast30Days;
    private long totalLoginsLast30Days;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourlyCount {
        private int hour;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyCount {
        private String date;
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
}
