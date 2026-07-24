package tn.moonside.userservice.dtos.requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateBannerRequest {

    @NotBlank(message = "Banner URL must not be blank")
    private String bannerUrl;
}
