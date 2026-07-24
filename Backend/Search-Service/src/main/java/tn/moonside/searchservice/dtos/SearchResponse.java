package tn.moonside.searchservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Combined search result, grouped by type so the frontend can render
 * "People / Teams / Posts" sections in the dropdown.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResponse {

    private List<SearchResultItem> users;
    private List<SearchResultItem> teams;
    private List<SearchResultItem> departments;
    private List<SearchResultItem> posts;
}
