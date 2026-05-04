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

                // User Service: User, UserRole, UserTeam, Role, Permission, PermissionRole, AuditLog
                .route("user-service", r -> r
                        .path("/users/**", "/auth/**", "/roles/**", "/permissions/**", "/audit-logs/**")
                        .uri("lb://USER-SERVICE"))

                // Organization Service: Department, Team
                .route("organization-service", r -> r
                        .path("/organizations/**")
                        .uri("lb://ORGANIZATION-SERVICE"))

                // Post Service: Post, Attachment, SavedPost, PostTag, Tag
                .route("post-service", r -> r
                        .path("/posts/**")
                        .uri("lb://POST-SERVICE"))

                // Interaction Service: Comment, Reaction, ReactionType
                .route("interaction-service", r -> r
                        .path("/interactions/**")
                        .uri("lb://INTERACTION-SERVICE"))

                // Notification Service: Notification
                .route("notification-service", r -> r
                        .path("/notifications/**")
                        .uri("lb://NOTIFICATION-SERVICE"))

                // Badge Service: Badge, UserBadge, AuditLog
                .route("badge-service", r -> r
                        .path("/badges/**")
                        .uri("lb://BADGE-SERVICE"))

                // Media Service: file uploads, avatar storage
                .route("media-service", r -> r
                        .path("/media/**")
                        .uri("lb://MEDIA-SERVICE"))

                .build();
    }
}