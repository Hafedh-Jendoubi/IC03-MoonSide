package tn.moonside.userservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAvatarRequest {

    @NotBlank(message = "Avatar URL must not be blank")
    private String avatarUrl;
}
