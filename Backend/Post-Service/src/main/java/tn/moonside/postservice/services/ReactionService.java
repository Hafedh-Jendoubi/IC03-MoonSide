package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.audit.AuditClient;
import tn.moonside.postservice.audit.PostAuditAction;
import tn.moonside.postservice.dtos.requests.ReactionRequest;
import tn.moonside.postservice.dtos.responses.ReactionResponse;
import tn.moonside.postservice.dtos.responses.ReactionSummaryResponse;
import tn.moonside.postservice.entities.Reaction;
import tn.moonside.postservice.entities.ReactionType;
import tn.moonside.postservice.repositories.ReactionRepository;
import tn.moonside.postservice.repositories.ReactionTypeRepository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final ReactionTypeRepository reactionTypeRepository;
    private final AuditClient auditClient;

    /**
     * Toggle reaction: if the user already has the same reaction, remove it.
     * If they have a different reaction, switch it. Otherwise add new.
     */
    public ReactionResponse toggleReaction(String reactableType, String reactableId,
                                           ReactionRequest req, String userId) {
        ReactionType reactionType = reactionTypeRepository.findByCode(req.getReactionTypeCode())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Unknown reaction type: " + req.getReactionTypeCode()));

        Optional<Reaction> existing = reactionRepository
                .findByUserIdAndReactableTypeAndReactableId(userId, reactableType, reactableId);

        if (existing.isPresent()) {
            Reaction r = existing.get();
            if (r.getReactionTypeId().equals(reactionType.getId())) {
                // Same reaction → remove (toggle off)
                reactionRepository.delete(r);

                auditClient.log(userId, reactableId, reactableType, PostAuditAction.REACTION_REMOVED,
                        "Reaction '" + req.getReactionTypeCode() + "' removed from " +
                        reactableType.toLowerCase() + " '" + reactableId + "'",
                        true, req.getReactionTypeCode(), null);

                return null;
            }
            // Different reaction → switch
            String oldCode = reactionTypeRepository.findById(r.getReactionTypeId())
                    .map(ReactionType::getCode).orElse(r.getReactionTypeId());
            r.setReactionTypeId(reactionType.getId());
            ReactionResponse response = toResponse(reactionRepository.save(r), reactionType);

            auditClient.log(userId, reactableId, reactableType, PostAuditAction.REACTION_CHANGED,
                    "Reaction changed from '" + oldCode + "' to '" + req.getReactionTypeCode() +
                    "' on " + reactableType.toLowerCase() + " '" + reactableId + "'",
                    true, oldCode, req.getReactionTypeCode());

            return response;
        }

        // New reaction
        Reaction reaction = Reaction.builder()
                .userId(userId)
                .reactionTypeId(reactionType.getId())
                .reactableType(reactableType)
                .reactableId(reactableId)
                .build();
        ReactionResponse response = toResponse(reactionRepository.save(reaction), reactionType);

        auditClient.log(userId, reactableId, reactableType, PostAuditAction.REACTION_ADDED,
                "Reaction '" + req.getReactionTypeCode() + "' added to " +
                reactableType.toLowerCase() + " '" + reactableId + "'",
                true, null, req.getReactionTypeCode());

        return response;
    }

    public ReactionSummaryResponse getSummary(String reactableType, String reactableId, String currentUserId) {
        List<Reaction> reactions = reactionRepository
                .findByReactableTypeAndReactableId(reactableType, reactableId);

        // Group by emoji
        Map<String, Long> byEmoji = reactions.stream().collect(Collectors.groupingBy(r -> {
            return reactionTypeRepository.findById(r.getReactionTypeId())
                    .map(ReactionType::getEmoji)
                    .orElse("?");
        }, Collectors.counting()));

        ReactionResponse userReaction = reactions.stream()
                .filter(r -> r.getUserId().equals(currentUserId))
                .findFirst()
                .map(r -> reactionTypeRepository.findById(r.getReactionTypeId())
                        .map(rt -> toResponse(r, rt)).orElse(null))
                .orElse(null);

        return ReactionSummaryResponse.builder()
                .total(reactions.size())
                .byEmoji(byEmoji)
                .userReaction(userReaction)
                .build();
    }

    public List<ReactionResponse> getReactors(String reactableType, String reactableId) {
        return reactionRepository.findByReactableTypeAndReactableId(reactableType, reactableId)
                .stream()
                .map(r -> reactionTypeRepository.findById(r.getReactionTypeId())
                        .map(rt -> toResponse(r, rt))
                        .orElse(null))
                .filter(r -> r != null)
                .collect(Collectors.toList());
    }

    private ReactionResponse toResponse(Reaction r, ReactionType rt) {
        return ReactionResponse.builder()
                .id(r.getId()).userId(r.getUserId())
                .reactionTypeId(r.getReactionTypeId())
                .reactionTypeCode(rt.getCode())
                .reactionTypeEmoji(rt.getEmoji())
                .reactableType(r.getReactableType())
                .reactableId(r.getReactableId())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
