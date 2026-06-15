package tn.moonside.notificationservice.config;

/**
 * CORS is handled entirely by the API Gateway (CorsWebFilter in the gateway module).
 * Defining CORS here as well would cause duplicate Access-Control-Allow-Origin headers,
 * which browsers reject. The Gateway already has a dedupeResponseHeader filter on the
 * notification route to strip any accidental duplicates from SSE responses.
 *
 * This class is intentionally left empty — do not add a CorsFilter bean here.
 */
public class CorsConfig {
}
