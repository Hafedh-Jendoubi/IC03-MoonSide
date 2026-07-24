package tn.moonside.postservice.dtos.responses;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveyOptionResponse {
    private String id;
    private String text;
    private int voteCount;
    /** Percentage of total votes, 0–100. */
    private double percentage;
}
