package tn.moonside.searchservice.documents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

/**
 * One remembered search term for one user. Unlike the other documents in
 * this package, this index is owned and written by Search-Service itself
 * (not mirrored from another service) — it powers the "Recent searches"
 * list shown under the navbar search box.
 */
@Document(indexName = "search_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchHistoryDocument {

    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String userId;

    @Field(type = FieldType.Keyword)
    private String query;

    /**
     * ISO-8601 instant string (e.g. "2026-06-18T10:15:30.123Z"). Stored as a
     * keyword rather than a native date field to match this service's
     * existing convention (see PostSearchDocument#createdAt) — sorting is
     * just a plain string comparison, which works fine since ISO-8601 UTC
     * timestamps sort lexicographically in chronological order.
     */
    @Field(type = FieldType.Keyword)
    private String searchedAt;
}
