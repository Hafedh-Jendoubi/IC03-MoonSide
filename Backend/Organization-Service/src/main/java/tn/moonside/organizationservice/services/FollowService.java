package tn.moonside.organizationservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.moonside.organizationservice.dtos.responses.UserFollowsResponse;
import tn.moonside.organizationservice.entities.Follow;
import tn.moonside.organizationservice.enums.FollowTargetType;
import tn.moonside.organizationservice.repositories.FollowRepository;

import java.util.List;

/**
 * Service responsible for querying what a user follows.
 * The existing follow/unfollow write operations live in DepartmentService
 * and TeamService respectively; this service only handles read operations
 * that span both target types.
 */
@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;

    /**
     * Returns the IDs of every department and every team that {@code userId}
     * is currently following.
     *
     * @param userId the authenticated user's ID
     * @return a DTO containing two lists of IDs, never null
     */
    public UserFollowsResponse getUserFollows(String userId) {
        List<Follow> allFollows = followRepository.findByUserId(userId);

        List<String> departmentIds = allFollows.stream()
                .filter(f -> f.getTargetType() == FollowTargetType.DEPARTMENT)
                .map(Follow::getTargetId)
                .toList();

        List<String> teamIds = allFollows.stream()
                .filter(f -> f.getTargetType() == FollowTargetType.TEAM)
                .map(Follow::getTargetId)
                .toList();

        return UserFollowsResponse.builder()
                .followedDepartmentIds(departmentIds)
                .followedTeamIds(teamIds)
                .build();
    }
}
