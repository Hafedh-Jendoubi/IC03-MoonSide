package tn.moonside.searchservice.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;
import org.springframework.data.elasticsearch.annotations.Setting;

@Document(indexName = "posts")
@Setting(settingPath = "elasticsearch/user-settings.json")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "autocomplete", searchAnalyzer = "standard")
    private String content;

    @Field(type = FieldType.Keyword)
    private String authorId;

    @Field(type = FieldType.Keyword)
    private String authorName;

    @Field(type = FieldType.Keyword)
    private String postType;

    @Field(type = FieldType.Keyword)
    private String postVisibility;

    @Field(type = FieldType.Keyword)
    private String createdAt;
}
