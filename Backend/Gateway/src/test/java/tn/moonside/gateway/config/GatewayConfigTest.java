package tn.moonside.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.gateway.route.Route;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.TestPropertySource;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the route table built by GatewayConfig#customRouteLocator: every
 * declared service gets exactly one route, routed to the expected
 * `lb://<SERVICE-NAME>` load-balanced URI used for Eureka-based discovery.
 *
 * We fetch the bean by its @Bean method name ("customRouteLocator") rather
 * than autowiring RouteLocator directly, since Spring Cloud Gateway also
 * registers a @Primary CachingRouteLocator that aggregates every RouteLocator
 * bean in the context (including this one) — asking for it by name keeps
 * this test scoped to exactly the routes GatewayConfig defines.
 *
 * Uses webEnvironment = RANDOM_PORT rather than NONE: Spring Cloud Gateway's
 * autoconfiguration (RouteLocatorBuilder and friends) only activates for a
 * reactive web ApplicationContext, so a plain NONE context never builds the
 * customRouteLocator bean in the first place and context loading fails.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
class GatewayConfigTest {

    @Autowired
    private ApplicationContext context;

    private Map<String, String> routeIdToUri() {
        RouteLocator routeLocator = context.getBean("customRouteLocator", RouteLocator.class);
        return routeLocator.getRoutes()
                .collectMap(Route::getId, route -> route.getUri().toString())
                .block(Duration.ofSeconds(5));
    }

    @Test
    void definesExactlyNineRoutes() {
        assertThat(routeIdToUri()).hasSize(9);
    }

    @Test
    void routesEachServiceToItsLoadBalancedEurekaUri() {
        Map<String, String> routes = routeIdToUri();

        assertThat(routes)
                .containsEntry("user-service", "lb://USER-SERVICE")
                .containsEntry("organization-service", "lb://ORGANIZATION-SERVICE")
                .containsEntry("post-service", "lb://POST-SERVICE")
                .containsEntry("interaction-service", "lb://INTERACTION-SERVICE")
                .containsEntry("notification-service", "lb://NOTIFICATION-SERVICE")
                .containsEntry("badge-service", "lb://BADGE-SERVICE")
                .containsEntry("media-service", "lb://MEDIA-SERVICE")
                .containsEntry("search-service", "lb://SEARCH-SERVICE")
                .containsEntry("ai-service", "lb://AI-SERVICE");
    }

    @Test
    void aiServiceRouteMatchesTheAiPathPrefix() {
        RouteLocator routeLocator = context.getBean("customRouteLocator", RouteLocator.class);
        Route aiRoute = routeLocator.getRoutes()
                .filter(route -> "ai-service".equals(route.getId()))
                .blockFirst(Duration.ofSeconds(5));

        assertThat(aiRoute).isNotNull();
        assertThat(aiRoute.getUri().toString()).isEqualTo("lb://AI-SERVICE");
    }
}
