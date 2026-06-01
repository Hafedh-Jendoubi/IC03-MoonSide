package tn.moonside.postservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReactionRequest {

    @NotBlank(message = "Reaction type code is required")
    private String reactionTypeCode;  // e.g. "LIKE", "LOVE"
}
