package tn.moonside.userservice.email;

/**
 * Sends transactional emails.
 *
 * Implemented over Brevo's HTTPS API (see {@link BrevoEmailService}) rather than raw SMTP.
 * Render's free-tier web services block outbound traffic on SMTP ports (25, 465, 587),
 * so SMTP-based sending (e.g. via Gmail) fails with connection timeouts once deployed there.
 * Brevo's API is a plain HTTPS POST (port 443), which is never blocked.
 */
public interface EmailService {

    /**
     * Sends a multipart-style email: an HTML body for modern clients with a
     * plain-text fallback for clients that don't render HTML.
     *
     * @param to           recipient address
     * @param subject      email subject
     * @param textFallback plain-text version of the email
     * @param html         HTML version of the email
     */
    void sendHtmlEmail(String to, String subject, String textFallback, String html);
}
