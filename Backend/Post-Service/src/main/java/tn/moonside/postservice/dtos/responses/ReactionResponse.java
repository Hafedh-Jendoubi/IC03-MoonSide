package tn.moonside.postservice.dtos.responses;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReactionResponse {
    private String id;
    private String userId;
    private String reactionTypeId;
    private String reactionTypeCode;
    private String reactionTypeEmoji;
    private String reactableType;
    private String reactableId;
    private LocalDateTime createdAt;
}
