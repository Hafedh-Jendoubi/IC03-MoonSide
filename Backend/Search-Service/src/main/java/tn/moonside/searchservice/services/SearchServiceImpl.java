package tn.moonside.searchservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.moonside.searchservice.documents.DepartmentSearchDocument;
import tn.moonside.searchservice.documents.PostSearchDocument;
import tn.moonside.searchservice.documents.TeamSearchDocument;
import tn.moonside.searchservice.documents.UserSearchDocument;
import tn.moonside.searchservice.dtos.SearchResponse;
import tn.moonside.searchservice.dtos.SearchResultItem;
import tn.moonside.searchservice.repositories.DepartmentSearchRepository;
import tn.moonside.searchservice.repositories.PostSearchRepository;
import tn.moonside.searchservice.repositories.TeamSearchRepository;
import tn.moonside.searchservice.repositories.UserSearchRepository;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    /** Keep the dropdown short and fast — this is a "quick suggestions" search, not a full results page. */
    private static final int MAX_RESULTS_PER_TYPE = 6;
    private static final int CONTENT_SNIPPET_LENGTH = 120;

    private final UserSearchRepository userSearchRepository;
    private final PostSearchRepository postSearchRepository;
    private final TeamSearchRepository teamSearchRepository;
    private final DepartmentSearchRepository departmentSearchRepository;

    @Override
    public SearchResponse search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return SearchResponse.builder()
                    .users(Collections.emptyList())
                    .teams(Collections.emptyList())
                    .departments(Collections.emptyList())
                    .posts(Collections.emptyList())
                    .build();
        }

        String q = query.trim();

        List<SearchResultItem> users = userSearchRepository
                .findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(q, q, q, q)
                .stream()
                .filter(UserSearchDocument::isActive)
                .limit(MAX_RESULTS_PER_TYPE)
                .map(this::toUserItem)
                .collect(Collectors.toList());

        List<SearchResultItem> teams = teamSearchRepository
                .findByNameStartingWithOrDescriptionContaining(q, q)
                .stream()
                .limit(MAX_RESULTS_PER_TYPE)
                .map(this::toTeamItem)
                .collect(Collectors.toList());

        List<SearchResultItem> departments = departmentSearchRepository
                .findByNameStartingWithOrDescriptionContaining(q, q)
                .stream()
                .limit(MAX_RESULTS_PER_TYPE)
                .map(this::toDepartmentItem)
                .collect(Collectors.toList());

        List<SearchResultItem> posts = postSearchRepository
                .findByContentContaining(q)
                .stream()
                .limit(MAX_RESULTS_PER_TYPE)
                .map(this::toPostItem)
                .collect(Collectors.toList());

        return SearchResponse.builder().users(users).teams(teams).departments(departments).posts(posts).build();
    }

    private SearchResultItem toUserItem(UserSearchDocument u) {
        String first = u.getFirstName() != null ? u.getFirstName() : "";
        String last = u.getLastName() != null ? u.getLastName() : "";
        String fullName = (first + " " + last).trim();

        return SearchResultItem.builder()
                .id(u.getId())
                .type("USER")
                .title(fullName.isEmpty() ? u.getEmail() : fullName)
                .subtitle(u.getJobTitle())
                .imageUrl(u.getAvatar())
                .build();
    }

    private SearchResultItem toTeamItem(TeamSearchDocument t) {
        return SearchResultItem.builder()
                .id(t.getId())
                .type("TEAM")
                .title(t.getName())
                .subtitle(t.getDescription())
                .imageUrl(t.getAvatarUrl())
                .build();
    }

    private SearchResultItem toDepartmentItem(DepartmentSearchDocument d) {
        return SearchResultItem.builder()
                .id(d.getId())
                .type("DEPARTMENT")
                .title(d.getName())
                .subtitle(d.getDescription())
                .imageUrl(d.getAvatarUrl())
                .build();
    }

    private SearchResultItem toPostItem(PostSearchDocument p) {
        String content = p.getContent() != null ? p.getContent() : "";
        String snippet = content.length() > CONTENT_SNIPPET_LENGTH
                ? content.substring(0, CONTENT_SNIPPET_LENGTH) + "…"
                : content;

        return SearchResultItem.builder()
                .id(p.getId())
                .type("POST")
                .title(snippet.isEmpty() ? "(no content)" : snippet)
                .subtitle(p.getPostType())
                .teamId(p.getTeamId())
                .build();
    }
}
