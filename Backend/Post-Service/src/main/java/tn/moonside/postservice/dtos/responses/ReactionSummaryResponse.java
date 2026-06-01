package tn.moonside.postservice.dtos.responses;

import lombok.*;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReactionSummaryResponse {
    private long total;
    /** Map of emoji → count, e.g. {"👍": 5, "❤️": 2} */
    private Map<String, Long> byEmoji;
    /** The current user's reaction (null if none). */
    private ReactionResponse userReaction;
}
