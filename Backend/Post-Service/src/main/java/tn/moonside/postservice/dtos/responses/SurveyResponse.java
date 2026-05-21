package tn.moonside.postservice.dtos.responses;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SurveyResponse {
    private String postId;
    private String surveyQuestion;
    private List<SurveyOptionResponse> options;
    private int totalVotes;
    private boolean surveyOpen;
    /** The optionId the requesting user voted for, or null. */
    private String userVotedOptionId;
}
