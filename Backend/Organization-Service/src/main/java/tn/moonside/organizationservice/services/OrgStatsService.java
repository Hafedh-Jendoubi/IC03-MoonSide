package tn.moonside.organizationservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.moonside.organizationservice.dtos.responses.OrgStatsResponse;
import tn.moonside.organizationservice.entities.Department;
import tn.moonside.organizationservice.entities.Project;
import tn.moonside.organizationservice.entities.Team;
import tn.moonside.organizationservice.repositories.DepartmentRepository;
import tn.moonside.organizationservice.repositories.ProjectRepository;
import tn.moonside.organizationservice.repositories.TeamRepository;
import tn.moonside.organizationservice.repositories.UserTeamRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes live statistics for the admin back-office dashboard: departments,
 * teams, and projects — real counts and breakdowns, no mock data.
 */
@Service
@RequiredArgsConstructor
public class OrgStatsService {

    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final DepartmentRepository departmentRepository;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final UserTeamRepository userTeamRepository;

    public OrgStatsResponse getStats() {
        List<Department> departments = departmentRepository.findAll();
        List<Team> teams = teamRepository.findAll();
        List<Project> projects = projectRepository.findAll();

        long totalDepartments = departments.size();
        long activeDepartments = departments.stream().filter(Department::isActive).count();
        long inactiveDepartments = totalDepartments - activeDepartments;

        long totalTeams = teams.size();
        long independentTeams = teams.stream().filter(t -> t.getDepartmentId() == null).count();

        long totalProjects = projects.size();

        double avgTeamsPerDepartment = totalDepartments == 0 ? 0
                : round(totalTeams / (double) totalDepartments);

        double avgMembersPerTeam = totalTeams == 0 ? 0
                : round(teams.stream().mapToLong(t -> userTeamRepository.countByTeamId(t.getId())).sum()
                        / (double) totalTeams);

        List<OrgStatsResponse.NamedCount> projectsByStatus = projects.stream()
                .collect(Collectors.groupingBy(p -> p.getStatus() != null ? p.getStatus().name() : "UNKNOWN",
                        Collectors.counting()))
                .entrySet().stream()
                .map(e -> OrgStatsResponse.NamedCount.builder().name(e.getKey()).count(e.getValue()).build())
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());

        Map<String, String> deptNameById = departments.stream()
                .collect(Collectors.toMap(Department::getId, Department::getName));

        List<OrgStatsResponse.NamedCount> teamsByDepartment = teams.stream()
                .filter(t -> t.getDepartmentId() != null)
                .collect(Collectors.groupingBy(t -> deptNameById.getOrDefault(t.getDepartmentId(), "Unknown"),
                        Collectors.counting()))
                .entrySet().stream()
                .map(e -> OrgStatsResponse.NamedCount.builder().name(e.getKey()).count(e.getValue()).build())
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());

        List<OrgStatsResponse.DailyCount> departmentsCreatedPerDay =
                dailySeries(departments.stream().map(Department::getCreatedAt).collect(Collectors.toList()), 14);
        List<OrgStatsResponse.DailyCount> teamsCreatedPerDay =
                dailySeries(teams.stream().map(Team::getCreatedAt).collect(Collectors.toList()), 14);
        List<OrgStatsResponse.DailyCount> projectsCreatedPerDay =
                dailySeries(projects.stream().map(Project::getCreatedAt).collect(Collectors.toList()), 14);

        return OrgStatsResponse.builder()
                .totalDepartments(totalDepartments)
                .activeDepartments(activeDepartments)
                .inactiveDepartments(inactiveDepartments)
                .totalTeams(totalTeams)
                .independentTeams(independentTeams)
                .totalProjects(totalProjects)
                .avgTeamsPerDepartment(avgTeamsPerDepartment)
                .avgMembersPerTeam(avgMembersPerTeam)
                .projectsByStatus(projectsByStatus)
                .teamsByDepartment(teamsByDepartment)
                .departmentsCreatedPerDay(departmentsCreatedPerDay)
                .teamsCreatedPerDay(teamsCreatedPerDay)
                .projectsCreatedPerDay(projectsCreatedPerDay)
                .build();
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private List<OrgStatsResponse.DailyCount> dailySeries(List<LocalDateTime> dates, int days) {
        Map<String, Long> counts = dates.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(d -> d.toLocalDate().format(DAY_FMT), Collectors.counting()));

        List<OrgStatsResponse.DailyCount> series = new ArrayList<>();
        LocalDate start = LocalDate.now().minusDays(days - 1L);
        for (int i = 0; i < days; i++) {
            String key = start.plusDays(i).format(DAY_FMT);
            series.add(OrgStatsResponse.DailyCount.builder()
                    .date(key)
                    .count(counts.getOrDefault(key, 0L))
                    .build());
        }
        return series;
    }
}
