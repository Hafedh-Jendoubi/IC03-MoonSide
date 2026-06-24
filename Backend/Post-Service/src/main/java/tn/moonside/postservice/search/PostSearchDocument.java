package tn.moonside.postservice.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

/**
 * Denormalized, search-friendly view of a {@link tn.moonside.postservice.entities.Post}.
 * Indexed into Elasticsearch (index "posts") so Search-Service can query it.
 * Only PUBLIC posts are ever indexed — see {@link PostSearchSyncListener} —
 * so private, team-only, department-only, or draft content never leaks
 * through global search.
 */
@Document(indexName = "posts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostSearchDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text)
    private String content;

    @Field(type = FieldType.Keyword)
    private String authorId;

    @Field(type = FieldType.Keyword)
    private String teamId;

    @Field(type = FieldType.Keyword)
    private String postType;

    @Field(type = FieldType.Keyword)
    private String createdAt;
}
