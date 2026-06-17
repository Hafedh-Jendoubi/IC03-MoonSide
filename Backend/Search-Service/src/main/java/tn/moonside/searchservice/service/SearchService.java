package tn.moonside.searchservice.service;

import co.elastic.clients.elasticsearch._types.query_dsl.TextQueryType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;
import tn.moonside.searchservice.document.*;
import tn.moonside.searchservice.dto.SearchDto;
import tn.moonside.searchservice.repository.*;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final ElasticsearchOperations elasticsearchOperations;
    private final UserSearchRepository userSearchRepository;
    private final TeamSearchRepository teamSearchRepository;
    private final DepartmentSearchRepository departmentSearchRepository;
    private final PostSearchRepository postSearchRepository;

    public SearchDto.SearchResult globalSearch(String query, int maxPerCategory) {
        log.debug("Global search: query='{}', maxPerCategory={}", query, maxPerCategory);

        List<SearchDto.UserHit> users = searchUsers(query, maxPerCategory);
        List<SearchDto.TeamHit> teams = searchTeams(query, maxPerCategory);
        List<SearchDto.DepartmentHit> departments = searchDepartments(query, maxPerCategory);
        List<SearchDto.PostHit> posts = searchPosts(query, maxPerCategory);

        long totalHits = users.size() + teams.size() + departments.size() + posts.size();

        return SearchDto.SearchResult.builder()
                .users(users)
                .teams(teams)
                .departments(departments)
                .posts(posts)
                .totalHits(totalHits)
                .build();
    }

    private List<SearchDto.UserHit> searchUsers(String query, int max) {
        try {
            NativeQuery nativeQuery = NativeQuery.builder()
                    .withQuery(q -> q.multiMatch(mm -> mm
                            .query(query)
                            // fullName (concatenated "firstName lastName") catches multi-word
                            // queries like "Hafedh Jendoubi" as a single best-matching field.
                            // firstName/lastName/jobTitle/email catch single-word queries.
                            // best_fields picks whichever field scores highest and, unlike
                            // cross_fields, supports fuzziness for typo-tolerant matching.
                            .fields("fullName^3", "firstName", "lastName", "jobTitle", "email")
                            .type(TextQueryType.BestFields)
                            .operator(co.elastic.clients.elasticsearch._types.query_dsl.Operator.Or)
                            .fuzziness("AUTO")
                    ))
                    .withMaxResults(max)
                    .build();

            SearchHits<UserDocument> hits = elasticsearchOperations.search(nativeQuery, UserDocument.class);
            return hits.stream()
                    .map(h -> {
                        UserDocument d = h.getContent();
                        return SearchDto.UserHit.builder()
                                .id(d.getId())
                                .firstName(d.getFirstName())
                                .lastName(d.getLastName())
                                .email(d.getEmail())
                                .jobTitle(d.getJobTitle())
                                .avatar(d.getAvatar())
                                .build();
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("User search failed: {}", e.getMessage());
            return List.of();
        }
    }

    private List<SearchDto.TeamHit> searchTeams(String query, int max) {
        try {
            NativeQuery nativeQuery = NativeQuery.builder()
                    .withQuery(q -> q.multiMatch(mm -> mm
                            .query(query)
                            .fields("name^2", "description")
                            .type(TextQueryType.BestFields)
                            .fuzziness("AUTO")
                    ))
                    .withMaxResults(max)
                    .build();

            SearchHits<TeamDocument> hits = elasticsearchOperations.search(nativeQuery, TeamDocument.class);
            return hits.stream()
                    .map(h -> {
                        TeamDocument d = h.getContent();
                        return SearchDto.TeamHit.builder()
                                .id(d.getId())
                                .name(d.getName())
                                .description(d.getDescription())
                                .departmentId(d.getDepartmentId())
                                .avatarUrl(d.getAvatarUrl())
                                .build();
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Team search failed: {}", e.getMessage());
            return List.of();
        }
    }

    private List<SearchDto.DepartmentHit> searchDepartments(String query, int max) {
        try {
            NativeQuery nativeQuery = NativeQuery.builder()
                    .withQuery(q -> q.multiMatch(mm -> mm
                            .query(query)
                            .fields("name^2", "description")
                            .type(TextQueryType.BestFields)
                            .fuzziness("AUTO")
                    ))
                    .withMaxResults(max)
                    .build();

            SearchHits<DepartmentDocument> hits = elasticsearchOperations.search(nativeQuery, DepartmentDocument.class);
            return hits.stream()
                    .map(h -> {
                        DepartmentDocument d = h.getContent();
                        return SearchDto.DepartmentHit.builder()
                                .id(d.getId())
                                .name(d.getName())
                                .description(d.getDescription())
                                .avatarUrl(d.getAvatarUrl())
                                .build();
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Department search failed: {}", e.getMessage());
            return List.of();
        }
    }

    private List<SearchDto.PostHit> searchPosts(String query, int max) {
        try {
            NativeQuery nativeQuery = NativeQuery.builder()
                    .withQuery(q -> q.match(m -> m
                            .field("content")
                            .query(query)
                            .fuzziness("AUTO")
                    ))
                    .withMaxResults(max)
                    .build();

            SearchHits<PostDocument> hits = elasticsearchOperations.search(nativeQuery, PostDocument.class);
            return hits.stream()
                    .map(h -> {
                        PostDocument d = h.getContent();
                        return SearchDto.PostHit.builder()
                                .id(d.getId())
                                .content(d.getContent())
                                .authorId(d.getAuthorId())
                                .authorName(d.getAuthorName())
                                .postType(d.getPostType())
                                .createdAt(d.getCreatedAt())
                                .build();
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Post search failed: {}", e.getMessage());
            return List.of();
        }
    }

    // ── Index maintenance (called from Kafka consumers) ──────────────────────

    public void indexUser(SearchDto.UserIndexEvent event) {
        if ("DELETE".equals(event.getAction())) {
            userSearchRepository.deleteById(event.getId());
            return;
        }
        String fullName = (event.getFirstName() != null ? event.getFirstName() : "") + " "
                + (event.getLastName() != null ? event.getLastName() : "");
        userSearchRepository.save(UserDocument.builder()
                .id(event.getId())
                .firstName(event.getFirstName())
                .lastName(event.getLastName())
                .fullName(fullName.trim())
                .email(event.getEmail())
                .jobTitle(event.getJobTitle())
                .avatar(event.getAvatar())
                .active(event.isActive())
                .build());
    }

    public void indexTeam(SearchDto.TeamIndexEvent event) {
        if ("DELETE".equals(event.getAction())) {
            teamSearchRepository.deleteById(event.getId());
            return;
        }
        teamSearchRepository.save(TeamDocument.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .departmentId(event.getDepartmentId())
                .avatarUrl(event.getAvatarUrl())
                .isActive(event.isActive())
                .build());
    }

    public void indexDepartment(SearchDto.DepartmentIndexEvent event) {
        if ("DELETE".equals(event.getAction())) {
            departmentSearchRepository.deleteById(event.getId());
            return;
        }
        departmentSearchRepository.save(DepartmentDocument.builder()
                .id(event.getId())
                .name(event.getName())
                .description(event.getDescription())
                .avatarUrl(event.getAvatarUrl())
                .isActive(event.isActive())
                .build());
    }

    public void indexPost(SearchDto.PostIndexEvent event) {
        if ("DELETE".equals(event.getAction())) {
            postSearchRepository.deleteById(event.getId());
            return;
        }
        postSearchRepository.save(PostDocument.builder()
                .id(event.getId())
                .content(event.getContent())
                .authorId(event.getAuthorId())
                .authorName(event.getAuthorName())
                .postType(event.getPostType())
                .postVisibility(event.getPostVisibility())
                .createdAt(event.getCreatedAt())
                .build());
    }
}
