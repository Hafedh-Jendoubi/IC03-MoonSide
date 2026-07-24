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
 * Read-only view of the "users" Elasticsearch index. User-Service owns
 * writing to this index (see its UserSearchSyncListener); this service
 * only ever queries it.
 */
@Document(indexName = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSearchDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text)
    private String firstName;

    @Field(type = FieldType.Text)
    private String lastName;

    @Field(type = FieldType.Text)
    private String email;

    @Field(type = FieldType.Text)
    private String jobTitle;

    @Field(type = FieldType.Keyword)
    private String avatar;

    @Field(type = FieldType.Boolean)
    private boolean active;
}
