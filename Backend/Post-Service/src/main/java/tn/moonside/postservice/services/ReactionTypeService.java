package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.dtos.requests.ReactionTypeRequest;
import tn.moonside.postservice.dtos.responses.ReactionTypeResponse;
import tn.moonside.postservice.entities.ReactionType;
import tn.moonside.postservice.repositories.ReactionTypeRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReactionTypeService {

    private final ReactionTypeRepository reactionTypeRepository;

    public ReactionTypeResponse create(ReactionTypeRequest req) {
        if (reactionTypeRepository.existsByCode(req.getCode())) {
            throw new IllegalStateException("Reaction type already exists: " + req.getCode());
        }
        ReactionType rt = ReactionType.builder()
                .code(req.getCode().toUpperCase())
                .emoji(req.getEmoji())
                .name(req.getName())
                .description(req.getDescription())
                .build();
        return toResponse(reactionTypeRepository.save(rt));
    }

    public List<ReactionTypeResponse> getAll() {
        return reactionTypeRepository.findAll().stream().map(this::toResponse).toList();
    }

    public void delete(String id) {
        if (!reactionTypeRepository.existsById(id)) {
            throw new IllegalArgumentException("Reaction type not found: " + id);
        }
        reactionTypeRepository.deleteById(id);
    }

    private ReactionTypeResponse toResponse(ReactionType rt) {
        return ReactionTypeResponse.builder()
                .id(rt.getId()).code(rt.getCode()).emoji(rt.getEmoji())
                .name(rt.getName()).description(rt.getDescription())
                .createdAt(rt.getCreatedAt())
                .build();
    }
}
