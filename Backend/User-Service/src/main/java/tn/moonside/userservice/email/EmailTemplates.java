package tn.moonside.userservice.email;

/**
 * Builds the HTML markup for all transactional emails sent by the platform
 * (email verification, password reset, account invitation, ...).
 *
 * Kept table-based with inline styles on purpose: this is what renders
 * reliably across Gmail, Outlook desktop, Apple Mail and mobile clients.
 */
public final class EmailTemplates {

    private EmailTemplates() {
    }

    private static final String BRAND_COLOR = "#4F46E5";      // indigo-600
    private static final String BRAND_COLOR_DARK = "#4338CA"; // indigo-700
    private static final String TEXT_COLOR = "#1F2937";       // gray-800
    private static final String MUTED_COLOR = "#6B7280";      // gray-500
    private static final String BORDER_COLOR = "#E5E7EB";     // gray-200
    private static final String BG_COLOR = "#F3F4F6";         // gray-100

    // ── Public builders ────────────────────────────────────────────────

    /** Verify-email-address OTP message. */
    public static String verifyEmail(String appName, String name, String otp, int expiryMinutes) {
        String body =
            greeting(name) +
            paragraph("Welcome to <strong>" + escape(appName) + "</strong>! Please confirm this is your email " +
                      "address by entering the code below in the app.") +
            otpBlock(otp) +
            expiryNote(expiryMinutes) +
            divider() +
            mutedParagraph("If you did not create an account, you can safely ignore this email — no further " +
                           "action is needed.");

        return shell(appName, "Your verification code is " + otp, "Verify your email address", body);
    }

    /** Forgot / reset password OTP message. */
    public static String resetPasswordEmail(String appName, String name, String otp, int expiryMinutes) {
        String body =
            greeting(name) +
            paragraph("We received a request to reset your password. Enter the code below to continue.") +
            otpBlock(otp) +
            expiryNote(expiryMinutes) +
            divider() +
            mutedParagraph("If you did not request a password reset, please ignore this email — your password " +
                           "will remain unchanged.");

        return shell(appName, "Your password reset code is " + otp, "Reset your password", body);
    }

    /** Admin-created account invitation, with a one-time generated password. */
    public static String invitationEmail(String appName, String firstName, String email, String rawPassword,
                                          String loginUrl) {
        String credentialsTable =
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
            "style=\"margin:24px 0;border:1px solid " + BORDER_COLOR + ";border-radius:8px;overflow:hidden;\">" +
                credentialRow("Email", escape(email), true) +
                credentialRow("Temporary password", escape(rawPassword), false) +
            "</table>";

        String button = ctaButton("Log in to " + escape(appName), loginUrl);

        String body =
            greeting(firstName) +
            paragraph("An administrator has created an account for you on <strong>" + escape(appName) +
                      "</strong>. Here are your login credentials:") +
            credentialsTable +
            paragraph("For security reasons, please change your password as soon as you log in.") +
            button +
            divider() +
            mutedParagraph("If you did not expect this email, please contact your administrator.");

        return shell(appName, "Your " + appName + " account is ready", "Your account has been created", body);
    }

    // ── Shared building blocks ─────────────────────────────────────────

    private static String shell(String appName, String preheader, String heading, String innerBodyHtml) {
        return "<!DOCTYPE html>" +
        "<html lang=\"en\">" +
        "<head>" +
            "<meta charset=\"UTF-8\">" +
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
            "<title>" + escape(appName) + "</title>" +
        "</head>" +
        "<body style=\"margin:0;padding:0;background-color:" + BG_COLOR + ";" +
              "font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;\">" +
            // preheader (hidden preview text in inbox lists)
            "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;\">" + escape(preheader) +
                "&nbsp;&#8203;".repeat(20) + "</div>" +

            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                   "style=\"background-color:" + BG_COLOR + ";padding:32px 16px;\">" +
                "<tr><td align=\"center\">" +
                    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                           "style=\"max-width:520px;background-color:#FFFFFF;border-radius:12px;" +
                           "overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);\">" +

                        // header band
                        "<tr><td style=\"background:linear-gradient(135deg," + BRAND_COLOR + "," +
                               BRAND_COLOR_DARK + ");padding:28px 32px;\">" +
                            "<span style=\"font-size:20px;font-weight:700;color:#FFFFFF;letter-spacing:0.3px;\">" +
                                escape(appName) +
                            "</span>" +
                        "</td></tr>" +

                        // heading
                        "<tr><td style=\"padding:32px 32px 0 32px;\">" +
                            "<h1 style=\"margin:0 0 4px 0;font-size:20px;line-height:28px;color:" + TEXT_COLOR +
                                ";font-weight:600;\">" + escape(heading) + "</h1>" +
                        "</td></tr>" +

                        // body
                        "<tr><td style=\"padding:8px 32px 32px 32px;\">" +
                            innerBodyHtml +
                        "</td></tr>" +
                    "</table>" +

                    // footer (outside the card)
                    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" " +
                           "style=\"max-width:520px;\">" +
                        "<tr><td style=\"padding:20px 32px;text-align:center;\">" +
                            "<p style=\"margin:0;font-size:12px;line-height:18px;color:" + MUTED_COLOR + ";\">" +
                                "&copy; " + java.time.Year.now().getValue() + " " + escape(appName) +
                                ". All rights reserved." +
                            "</p>" +
                        "</td></tr>" +
                    "</table>" +
                "</td></tr>" +
            "</table>" +
        "</body>" +
        "</html>";
    }

    private static String greeting(String name) {
        return paragraph("Hi " + escape(name) + ",");
    }

    private static String paragraph(String htmlContent) {
        return "<p style=\"margin:0 0 16px 0;font-size:15px;line-height:24px;color:" + TEXT_COLOR + ";\">" +
               htmlContent + "</p>";
    }

    private static String mutedParagraph(String htmlContent) {
        return "<p style=\"margin:0;font-size:13px;line-height:20px;color:" + MUTED_COLOR + ";\">" +
               htmlContent + "</p>";
    }

    /** The centered, highlighted one-time code block. */
    private static String otpBlock(String otp) {
        String spacedOtp = String.join(" ", otp.split(""));
        return
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:8px 0 20px 0;\">" +
                "<tr><td align=\"center\">" +
                    "<div style=\"display:inline-block;background-color:#EEF2FF;border:1px solid #C7D2FE;" +
                         "border-radius:10px;padding:16px 28px;\">" +
                        "<span style=\"font-family:'Courier New',monospace;font-size:32px;font-weight:700;" +
                             "letter-spacing:6px;color:" + BRAND_COLOR_DARK + ";\">" + escape(spacedOtp) +
                        "</span>" +
                    "</div>" +
                "</td></tr>" +
            "</table>";
    }

    private static String expiryNote(int expiryMinutes) {
        return mutedParagraph("This code expires in " + expiryMinutes + " minutes.");
    }

    private static String divider() {
        return "<hr style=\"border:none;border-top:1px solid " + BORDER_COLOR + ";margin:24px 0;\">";
    }

    private static String credentialRow(String label, String value, boolean withBottomBorder) {
        String border = withBottomBorder ? "border-bottom:1px solid " + BORDER_COLOR + ";" : "";
        return "<tr>" +
            "<td style=\"padding:14px 16px;background-color:#F9FAFB;" + border +
                "font-size:13px;color:" + MUTED_COLOR + ";width:40%;\">" + escape(label) + "</td>" +
            "<td style=\"padding:14px 16px;" + border +
                "font-size:14px;color:" + TEXT_COLOR + ";font-weight:600;font-family:'Courier New',monospace;\">" +
                value + "</td>" +
        "</tr>";
    }

    private static String ctaButton(String label, String url) {
        return
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:8px 0 20px 0;\">" +
                "<tr><td align=\"center\">" +
                    "<a href=\"" + url + "\" target=\"_blank\" " +
                       "style=\"display:inline-block;background-color:" + BRAND_COLOR + ";color:#FFFFFF;" +
                       "text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;\">" +
                        escape(label) +
                    "</a>" +
                "</td></tr>" +
            "</table>";
    }

    /** Minimal HTML escaping for values interpolated into the template. */
    private static String escape(String value) {
        if (value == null) return "";
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }
}
