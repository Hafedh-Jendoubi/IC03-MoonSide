package tn.moonside.userservice.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Sends transactional emails through Brevo's (formerly Sendinblue) HTTPS API:
 * https://developers.brevo.com/reference/sendtransacemail
 *
 * Requirements on the Brevo side:
 *  - A Brevo account with the sender address (BREVO_SENDER_EMAIL / spring.mail.username)
 *    added under Senders & IP and verified (Brevo emails a confirmation link to that
 *    address — no domain ownership/DNS setup required).
 *  - An API key (Settings > SMTP & API > API Keys) exposed as BREVO_API_KEY.
 *
 * Free tier: 300 emails/day, sendable to any recipient once the sender is verified.
 */
@Service
@Slf4j
public class BrevoEmailService implements EmailService {

    private static final String BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

    private final RestTemplate restTemplate;

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.name:WorkSphere}")
    private String senderName;

    public BrevoEmailService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String textFallback, String html) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);
        headers.set("accept", "application/json");

        Map<String, Object> body = Map.of(
            "sender", Map.of("name", senderName, "email", senderEmail),
            "to", List.of(Map.of("email", to)),
            "subject", subject,
            "htmlContent", html,
            "textContent", textFallback
        );

        try {
            restTemplate.postForEntity(BREVO_ENDPOINT, new HttpEntity<>(body, headers), String.class);
            log.info("Email sent to {} via Brevo", to);
        } catch (RestClientException e) {
            log.error("Failed to send email to {} via Brevo: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
