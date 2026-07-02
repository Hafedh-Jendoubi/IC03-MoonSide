package tn.moonside.searchservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single, display-ready search hit. {@code type} tells the frontend which
 * icon/section to use and which route to navigate to when it's clicked.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultItem {

    private String id;

    /** "USER" | "TEAM" | "POST" */
    private String type;

    private String title;
    private String subtitle;
    private String imageUrl;

    /** Only set for POST results — lets the frontend link to the post's team. */
    private String teamId;
}
