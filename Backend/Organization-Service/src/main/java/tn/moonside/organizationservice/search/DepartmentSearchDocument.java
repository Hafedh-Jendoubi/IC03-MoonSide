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
 * Denormalized, search-friendly view of a {@link tn.moonside.organizationservice.entities.Department}.
 * Indexed into Elasticsearch (index "departments") so Search-Service can query it.
 * Only ACTIVE departments are ever indexed — see {@link DepartmentSearchSyncListener}.
 */
@Document(indexName = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentSearchDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text)
    private String name;

    @Field(type = FieldType.Text)
    private String description;

    @Field(type = FieldType.Keyword)
    private String avatarUrl;
}
