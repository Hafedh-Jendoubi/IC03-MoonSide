package tn.moonside.postservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SurveyVoteRequest {

    @NotBlank(message = "optionId is required")
    private String optionId;
}
