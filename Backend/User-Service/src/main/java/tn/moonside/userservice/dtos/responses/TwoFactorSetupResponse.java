package tn.moonside.userservice.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TwoFactorSetupResponse {
    private String secret;       // base32 secret to display / store in authenticator
    private String qrCodeUri;    // otpauth:// URI for QR code generation
    private String qrCodeImage;  // base64 PNG of QR code (data:image/png;base64,...)
}
