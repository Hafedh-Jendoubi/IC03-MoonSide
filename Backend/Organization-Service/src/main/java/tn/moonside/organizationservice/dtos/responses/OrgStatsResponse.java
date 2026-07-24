package tn.moonside.organizationservice.dtos.responses;

import lombok.*;

import java.util.List;

/**
 * Aggregated statistics for the admin back-office dashboard:
 * departments, teams, and projects.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgStatsResponse {

    private long totalDepartments;
    private long activeDepartments;
    private long inactiveDepartments;

    private long totalTeams;
    private long independentTeams; // teams with no department

    private long totalProjects;

    private double avgTeamsPerDepartment;
    private double avgMembersPerTeam;

    /** Projects grouped by status (PLANNING, IN_PROGRESS, ...). */
    private List<NamedCount> projectsByStatus;

    /** Teams grouped by department name — top departments by team count. */
    private List<NamedCount> teamsByDepartment;

    /** Departments/teams/projects created per day (last 14 days) — organizational growth. */
    private List<DailyCount> departmentsCreatedPerDay;
    private List<DailyCount> teamsCreatedPerDay;
    private List<DailyCount> projectsCreatedPerDay;

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
    public static class DailyCount {
        private String date; // yyyy-MM-dd
        private long count;
    }
}
