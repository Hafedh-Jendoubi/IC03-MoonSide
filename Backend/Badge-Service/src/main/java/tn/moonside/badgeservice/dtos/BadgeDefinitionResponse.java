package tn.moonside.badgeservice.dtos;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class BadgeDefinitionResponse {
    private String key;
    private String displayName;
    private String description;
    private String icon;
    private String category;
    private boolean earned;
    private int holderCount;
    private List<HolderSummary> holders;

    @Data
    @Builder
    public static class HolderSummary {
        private String userId;
        private String firstName;
        private String lastName;
        private String avatar;
        private String jobTitle;
        private LocalDateTime awardedAt;
    }
}
