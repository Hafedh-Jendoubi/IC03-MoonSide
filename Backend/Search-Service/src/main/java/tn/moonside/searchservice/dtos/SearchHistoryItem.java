package tn.moonside.searchservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single remembered search term, ready to render in the "Recent
 * searches" list under the navbar search box.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistoryItem {

    private String id;
    private String query;
    private String searchedAt;
}
