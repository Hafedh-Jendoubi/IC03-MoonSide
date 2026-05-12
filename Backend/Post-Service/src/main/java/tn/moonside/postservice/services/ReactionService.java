package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final ReactionTypeRepository reactionTypeRepository;

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
                return null;
            }
            // Different reaction → switch
            r.setReactionTypeId(reactionType.getId());
            return toResponse(reactionRepository.save(r), reactionType);
        }

        // New reaction
        Reaction reaction = Reaction.builder()
                .userId(userId)
                .reactionTypeId(reactionType.getId())
                .reactableType(reactableType)
                .reactableId(reactableId)
                .build();
        return toResponse(reactionRepository.save(reaction), reactionType);
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
                .collect(java.util.stream.Collectors.toList());
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
