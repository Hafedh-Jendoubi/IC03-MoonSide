package tn.moonside.postservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.postservice.dtos.requests.ReactionTypeRequest;
import tn.moonside.postservice.dtos.responses.ReactionTypeResponse;
import tn.moonside.postservice.entities.ReactionType;
import tn.moonside.postservice.repositories.ReactionTypeRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReactionTypeServiceTest {

    @Mock
    private ReactionTypeRepository reactionTypeRepository;

    @InjectMocks
    private ReactionTypeService reactionTypeService;

    @Test
    void create_success_uppercasesCode() {
        ReactionTypeRequest req = new ReactionTypeRequest();
        req.setCode("like");
        req.setEmoji("👍");
        req.setName("Like");
        req.setDescription("A like reaction");

        when(reactionTypeRepository.existsByCode("like")).thenReturn(false);
        when(reactionTypeRepository.save(any(ReactionType.class))).thenAnswer(inv -> {
            ReactionType rt = inv.getArgument(0);
            rt.setId("rt1");
            return rt;
        });

        ReactionTypeResponse response = reactionTypeService.create(req);

        assertThat(response.getId()).isEqualTo("rt1");
        assertThat(response.getCode()).isEqualTo("LIKE");
    }

    @Test
    void create_duplicate_throws() {
        ReactionTypeRequest req = new ReactionTypeRequest();
        req.setCode("LIKE");

        when(reactionTypeRepository.existsByCode("LIKE")).thenReturn(true);

        assertThatThrownBy(() -> reactionTypeService.create(req))
                .isInstanceOf(IllegalStateException.class);
        verify(reactionTypeRepository, never()).save(any());
    }

    @Test
    void getAll_returnsList() {
        ReactionType rt = ReactionType.builder().id("rt1").code("LIKE").emoji("👍").name("Like").build();
        when(reactionTypeRepository.findAll()).thenReturn(List.of(rt));

        List<ReactionTypeResponse> result = reactionTypeService.getAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCode()).isEqualTo("LIKE");
    }

    @Test
    void delete_success() {
        when(reactionTypeRepository.existsById("rt1")).thenReturn(true);

        reactionTypeService.delete("rt1");

        verify(reactionTypeRepository).deleteById("rt1");
    }

    @Test
    void delete_notFound_throws() {
        when(reactionTypeRepository.existsById("missing")).thenReturn(false);

        assertThatThrownBy(() -> reactionTypeService.delete("missing"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(reactionTypeRepository, never()).deleteById(anyString());
    }
}
