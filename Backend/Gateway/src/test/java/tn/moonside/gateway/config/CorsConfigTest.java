package tn.moonside.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

/**
 * Boots the real reactive stack and issues actual CORS preflight requests
 * against it, rather than reflecting on CorsConfiguration internals — this
 * is what an actual browser preflight looks like against the Gateway.
 *
 * The CorsWebFilter answers preflight (OPTIONS) requests itself, before any
 * gateway route would be resolved, so no downstream/Eureka connectivity is
 * required for these tests.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
class CorsConfigTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void allowsConfiguredFrontendOriginOnPreflight() {
        webTestClient.options()
                .uri("/users/me")
                .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:3000")
                .expectHeader().valueEquals(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, "true");
    }

    @Test
    void rejectsPreflightFromAnUnlistedOrigin() {
        webTestClient.options()
                .uri("/users/me")
                .header(HttpHeaders.ORIGIN, "https://evil.example.com")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                .exchange()
                .expectStatus().isForbidden();
    }

    @Test
    void exposesTheAuthorizationHeaderToTheBrowser() {
        webTestClient.options()
                .uri("/posts/123")
                .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().valueEquals(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Authorization");
    }

    @Test
    void allowsAllOfTheConfiguredHttpMethods() {
        for (String method : new String[]{"GET", "POST", "PUT", "DELETE", "PATCH"}) {
            webTestClient.options()
                    .uri("/badges/1")
                    .header(HttpHeaders.ORIGIN, "http://localhost:3000")
                    .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, method)
                    .exchange()
                    .expectStatus().isOk()
                    .expectHeader().exists(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS);
        }
    }
}
