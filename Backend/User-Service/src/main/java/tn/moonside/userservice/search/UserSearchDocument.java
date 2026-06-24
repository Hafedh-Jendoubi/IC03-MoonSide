package tn.moonside.userservice.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

/**
 * Denormalized, search-friendly view of a {@link tn.moonside.userservice.entities.User}.
 * Indexed into Elasticsearch (index "users") so Search-Service can query it.
 * Intentionally excludes sensitive fields (password hash, OTPs, 2FA secret, etc.) —
 * only what's needed to render a search result is copied over.
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
