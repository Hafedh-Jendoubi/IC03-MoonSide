package tn.moonside.userservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TwoFactorVerifyRequest {
    @NotBlank
    private String email;
    @NotBlank
    private String code;   // 6-digit TOTP code
}
