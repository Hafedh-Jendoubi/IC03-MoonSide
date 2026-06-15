package tn.moonside.searchservice.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

@Document(indexName = "teams")
@Setting(settingPath = "elasticsearch/user-settings.json")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "autocomplete", searchAnalyzer = "standard")
    private String name;

    @Field(type = FieldType.Text, analyzer = "autocomplete", searchAnalyzer = "standard")
    private String description;

    @Field(type = FieldType.Keyword)
    private String departmentId;

    @Field(type = FieldType.Keyword)
    private String avatarUrl;

    @Field(type = FieldType.Boolean)
    private boolean isActive;
}
