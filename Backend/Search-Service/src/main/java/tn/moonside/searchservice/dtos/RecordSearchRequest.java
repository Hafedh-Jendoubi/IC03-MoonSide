package tn.moonside.searchservice.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Request body for {@code POST /search/history}. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecordSearchRequest {

    private String query;
}
