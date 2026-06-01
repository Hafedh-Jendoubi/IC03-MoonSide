package tn.moonside.organizationservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.moonside.organizationservice.dtos.responses.UserFollowsResponse;
import tn.moonside.organizationservice.entities.Follow;
import tn.moonside.organizationservice.entities.Team;
import tn.moonside.organizationservice.entities.UserTeam;
import tn.moonside.organizationservice.enums.FollowTargetType;
import tn.moonside.organizationservice.repositories.FollowRepository;
import tn.moonside.organizationservice.repositories.TeamRepository;
import tn.moonside.organizationservice.repositories.UserTeamRepository;

import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

/**
 * Service responsible for querying what a user follows.
 * The existing follow/unfollow write operations live in DepartmentService
 * and TeamService respectively; this service only handles read operations
 * that span both target types.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FollowService {

    private final FollowRepository  followRepository;
    private final UserTeamRepository userTeamRepository;
    private final TeamRepository    teamRepository;

    /**
     * Returns the complete set of departments and teams that should appear in
     * {@code userId}'s personalised feed, combining two sources:
     *
     * <ol>
     *   <li><b>Explicit follows</b> — departments and teams the user has chosen
     *       to follow.</li>
     *   <li><b>Implicit membership</b> — teams the user belongs to (joined or
     *       assigned) and the departments those teams are part of.  The user
     *       does not need to follow these explicitly; membership is sufficient.</li>
     * </ol>
     *
     * All four lists are deduplicated so that an ID appearing in both a followed
     * list and a member list is only included once.
     *
     * @param userId the authenticated user's ID
     * @return a DTO containing four lists of IDs, never null
     */
    public UserFollowsResponse getUserFollows(String userId) {

        // ── 1. Explicit follows ──────────────────────────────────────────────
        List<Follow> allFollows = followRepository.findByUserId(userId);

        List<String> followedDepartmentIds = allFollows.stream()
                .filter(f -> f.getTargetType() == FollowTargetType.DEPARTMENT)
                .map(Follow::getTargetId)
                .distinct()
                .toList();

        List<String> followedTeamIds = allFollows.stream()
                .filter(f -> f.getTargetType() == FollowTargetType.TEAM)
                .map(Follow::getTargetId)
                .distinct()
                .toList();

        // ── 2. Member teams (joined / assigned) ──────────────────────────────
        List<String> memberTeamIds = userTeamRepository.findByUserId(userId)
                .stream()
                .map(UserTeam::getTeamId)
                .distinct()
                .toList();

        // ── 3. Parent departments of member teams ────────────────────────────
        List<String> memberDepartmentIds = memberTeamIds.stream()
                .map(teamId -> teamRepository.findById(teamId).orElse(null))
                .filter(Objects::nonNull)
                .map(Team::getDepartmentId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        log.debug(
            "getUserFollows user={}: followedDepts={}, followedTeams={}, memberTeams={}, memberDepts={}",
            userId,
            followedDepartmentIds.size(), followedTeamIds.size(),
            memberTeamIds.size(), memberDepartmentIds.size());

        return UserFollowsResponse.builder()
                .followedDepartmentIds(followedDepartmentIds)
                .followedTeamIds(followedTeamIds)
                .memberTeamIds(memberTeamIds)
                .memberDepartmentIds(memberDepartmentIds)
                .build();
    }
}
