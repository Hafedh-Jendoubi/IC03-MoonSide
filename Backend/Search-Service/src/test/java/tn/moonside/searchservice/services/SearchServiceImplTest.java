package tn.moonside.searchservice.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchServiceImplTest {

    @Mock
    private UserSearchRepository userSearchRepository;

    @Mock
    private PostSearchRepository postSearchRepository;

    @Mock
    private TeamSearchRepository teamSearchRepository;

    @Mock
    private DepartmentSearchRepository departmentSearchRepository;

    @InjectMocks
    private SearchServiceImpl searchService;

    @Test
    void search_nullQuery_returnsEmptyResultsWithoutQueryingRepositories() {
        SearchResponse response = searchService.search(null);

        assertThat(response.getUsers()).isEmpty();
        assertThat(response.getTeams()).isEmpty();
        assertThat(response.getDepartments()).isEmpty();
        assertThat(response.getPosts()).isEmpty();
        verifyNoInteractions(userSearchRepository, postSearchRepository, teamSearchRepository, departmentSearchRepository);
    }

    @Test
    void search_blankQuery_returnsEmptyResultsWithoutQueryingRepositories() {
        SearchResponse response = searchService.search("   ");

        assertThat(response.getUsers()).isEmpty();
        assertThat(response.getTeams()).isEmpty();
        assertThat(response.getDepartments()).isEmpty();
        assertThat(response.getPosts()).isEmpty();
        verifyNoInteractions(userSearchRepository, postSearchRepository, teamSearchRepository, departmentSearchRepository);
    }

    @Test
    void search_trimsQueryBeforeDelegating() {
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                "abc", "abc", "abc", "abc")).thenReturn(List.of());
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining("abc", "abc")).thenReturn(List.of());
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining("abc", "abc")).thenReturn(List.of());
        when(postSearchRepository.findByContentContaining("abc")).thenReturn(List.of());

        searchService.search("  abc  ");

        verify(userSearchRepository).findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                "abc", "abc", "abc", "abc");
        verify(postSearchRepository).findByContentContaining("abc");
    }

    @Test
    void search_filtersOutInactiveUsers() {
        UserSearchDocument active = UserSearchDocument.builder()
                .id("u1").firstName("Jane").lastName("Doe").email("jane@example.com").active(true).build();
        UserSearchDocument inactive = UserSearchDocument.builder()
                .id("u2").firstName("John").lastName("Smith").email("john@example.com").active(false).build();
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                any(), any(), any(), any())).thenReturn(List.of(active, inactive));
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(postSearchRepository.findByContentContaining(any())).thenReturn(List.of());

        SearchResponse response = searchService.search("j");

        assertThat(response.getUsers()).hasSize(1);
        assertThat(response.getUsers().get(0).getId()).isEqualTo("u1");
    }

    @Test
    void search_limitsUsersToSixResults() {
        List<UserSearchDocument> tenActiveUsers = java.util.stream.IntStream.range(0, 10)
                .mapToObj(i -> UserSearchDocument.builder()
                        .id("u" + i).firstName("User").lastName(String.valueOf(i)).active(true).build())
                .toList();
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                any(), any(), any(), any())).thenReturn(tenActiveUsers);
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(postSearchRepository.findByContentContaining(any())).thenReturn(List.of());

        SearchResponse response = searchService.search("user");

        assertThat(response.getUsers()).hasSize(6);
    }

    @Test
    void search_userItem_buildsFullNameTitle() {
        UserSearchDocument user = UserSearchDocument.builder()
                .id("u1").firstName("Jane").lastName("Doe").jobTitle("Engineer").avatar("avatar.png").active(true).build();
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                any(), any(), any(), any())).thenReturn(List.of(user));
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(postSearchRepository.findByContentContaining(any())).thenReturn(List.of());

        SearchResultItem item = searchService.search("jane").getUsers().get(0);

        assertThat(item.getType()).isEqualTo("USER");
        assertThat(item.getTitle()).isEqualTo("Jane Doe");
        assertThat(item.getSubtitle()).isEqualTo("Engineer");
        assertThat(item.getImageUrl()).isEqualTo("avatar.png");
    }

    @Test
    void search_userItem_fallsBackToEmailWhenNamesBlank() {
        UserSearchDocument user = UserSearchDocument.builder()
                .id("u1").firstName(null).lastName(null).email("jane@example.com").active(true).build();
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                any(), any(), any(), any())).thenReturn(List.of(user));
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(postSearchRepository.findByContentContaining(any())).thenReturn(List.of());

        SearchResultItem item = searchService.search("jane").getUsers().get(0);

        assertThat(item.getTitle()).isEqualTo("jane@example.com");
    }

    @Test
    void search_teamItem_mapsFields() {
        TeamSearchDocument team = TeamSearchDocument.builder()
                .id("t1").name("Engineering").description("Builds stuff").avatarUrl("team.png").build();
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                any(), any(), any(), any())).thenReturn(List.of());
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of(team));
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(postSearchRepository.findByContentContaining(any())).thenReturn(List.of());

        SearchResultItem item = searchService.search("eng").getTeams().get(0);

        assertThat(item.getType()).isEqualTo("TEAM");
        assertThat(item.getTitle()).isEqualTo("Engineering");
        assertThat(item.getSubtitle()).isEqualTo("Builds stuff");
        assertThat(item.getImageUrl()).isEqualTo("team.png");
    }

    @Test
    void search_departmentItem_mapsFields() {
        DepartmentSearchDocument dept = DepartmentSearchDocument.builder()
                .id("d1").name("HR").description("People ops").avatarUrl("dept.png").build();
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                any(), any(), any(), any())).thenReturn(List.of());
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of(dept));
        when(postSearchRepository.findByContentContaining(any())).thenReturn(List.of());

        SearchResultItem item = searchService.search("hr").getDepartments().get(0);

        assertThat(item.getType()).isEqualTo("DEPARTMENT");
        assertThat(item.getTitle()).isEqualTo("HR");
        assertThat(item.getSubtitle()).isEqualTo("People ops");
    }

    @Test
    void search_postItem_shortContent_notTruncated() {
        PostSearchDocument post = PostSearchDocument.builder()
                .id("p1").content("Short post").postType("TEXT").teamId("team1").build();
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                any(), any(), any(), any())).thenReturn(List.of());
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(postSearchRepository.findByContentContaining(any())).thenReturn(List.of(post));

        SearchResultItem item = searchService.search("short").getPosts().get(0);

        assertThat(item.getType()).isEqualTo("POST");
        assertThat(item.getTitle()).isEqualTo("Short post");
        assertThat(item.getSubtitle()).isEqualTo("TEXT");
        assertThat(item.getTeamId()).isEqualTo("team1");
    }

    @Test
    void search_postItem_longContent_isTruncatedWithEllipsis() {
        String longContent = "a".repeat(150);
        PostSearchDocument post = PostSearchDocument.builder()
                .id("p1").content(longContent).postType("TEXT").build();
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                any(), any(), any(), any())).thenReturn(List.of());
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(postSearchRepository.findByContentContaining(any())).thenReturn(List.of(post));

        SearchResultItem item = searchService.search("a").getPosts().get(0);

        assertThat(item.getTitle()).hasSize(121); // 120 chars + ellipsis character
        assertThat(item.getTitle()).endsWith("…");
    }

    @Test
    void search_postItem_emptyContent_usesPlaceholderTitle() {
        PostSearchDocument post = PostSearchDocument.builder().id("p1").content("").postType("TEXT").build();
        when(userSearchRepository.findByFirstNameStartingWithOrLastNameStartingWithOrEmailStartingWithOrJobTitleContaining(
                any(), any(), any(), any())).thenReturn(List.of());
        when(teamSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(departmentSearchRepository.findByNameStartingWithOrDescriptionContaining(any(), any())).thenReturn(List.of());
        when(postSearchRepository.findByContentContaining(any())).thenReturn(List.of(post));

        SearchResultItem item = searchService.search("x").getPosts().get(0);

        assertThat(item.getTitle()).isEqualTo("(no content)");
    }
}
