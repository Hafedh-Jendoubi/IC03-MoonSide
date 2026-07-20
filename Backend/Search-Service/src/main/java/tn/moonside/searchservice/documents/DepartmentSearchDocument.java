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
 * Read-only view of the "departments" Elasticsearch index. Organization-Service
 * owns writing to this index, and only ever indexes ACTIVE departments.
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
