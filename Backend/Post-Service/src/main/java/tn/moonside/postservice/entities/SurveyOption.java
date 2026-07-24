package tn.moonside.postservice.entities;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SurveyOption {
    private String id;      // UUID generated on server
    private String text;
    @Builder.Default
    private int voteCount = 0;
}
