package tn.moonside.organizationservice.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

/**
 * Denormalized, search-friendly view of a {@link tn.moonside.organizationservice.entities.Team}.
 * Indexed into Elasticsearch (index "teams") so Search-Service can query it.
 * Only PUBLIC teams are ever indexed — see {@link TeamSearchSyncListener}.
 */
@Document(indexName = "teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamSearchDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text)
    private String name;

    @Field(type = FieldType.Text)
    private String description;

    @Field(type = FieldType.Keyword)
    private String avatarUrl;
}
