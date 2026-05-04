package tn.moonside.postservice.dtos.responses;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReactionTypeResponse {
    private String id;
    private String code;
    private String emoji;
    private String name;
    private String description;
    private LocalDateTime createdAt;
}
