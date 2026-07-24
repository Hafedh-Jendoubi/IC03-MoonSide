package tn.moonside.badgeservice.dtos;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserBadgeResponse {
    private String id;
    private String userId;
    private String badgeKey;
    private String displayName;
    private String description;
    private String icon;
    private String category;
    private LocalDateTime awardedAt;
}
