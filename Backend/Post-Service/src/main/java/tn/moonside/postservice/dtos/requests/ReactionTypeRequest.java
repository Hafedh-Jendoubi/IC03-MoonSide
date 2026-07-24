package tn.moonside.postservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReactionTypeRequest {

    @NotBlank(message = "Code is required")
    private String code;

    @NotBlank(message = "Emoji is required")
    private String emoji;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;
}
