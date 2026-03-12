package tn.moonside.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()

                // User Service: User, UserRole, UserTeam, Role, Permission, PermissionRole
                .route("user-service", r -> r
                        .path("/api/users/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://USER-SERVICE"))

                // Organization Service: Department, Team
                .route("organization-service", r -> r
                        .path("/api/organizations/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://ORGANIZATION-SERVICE"))

                // Post Service: Post, Attachment, SavedPost, PostTag, Tag
                .route("post-service", r -> r
                        .path("/api/posts/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://POST-SERVICE"))

                // Interaction Service: Comment, Reaction, ReactionType
                .route("interaction-service", r -> r
                        .path("/api/interactions/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://INTERACTION-SERVICE"))

                // Notification Service: Notification
                .route("notification-service", r -> r
                        .path("/api/notifications/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://NOTIFICATION-SERVICE"))

                // Badge Service: Badge, UserBadge, AuditLog
                .route("badge-service", r -> r
                        .path("/api/badges/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://BADGE-SERVICE"))

                .build();
    }
}