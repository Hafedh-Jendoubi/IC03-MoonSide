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
 * Read-only view of the "posts" Elasticsearch index. Post-Service owns
 * writing to this index, and only ever indexes PUBLIC posts so private,
 * team-only, department-only, or draft content never shows up in search.
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
