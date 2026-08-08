package tn.moonside.postservice.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import tn.moonside.postservice.dtos.responses.AttachmentResponse;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttachmentServiceTest {

    @Mock
    private PostAttachmentService postAttachmentService;

    @InjectMocks
    private AttachmentService attachmentService;

    @Test
    void uploadAttachment_delegates() {
        MockMultipartFile file = new MockMultipartFile("file", "a.png", "image/png", "data".getBytes());
        AttachmentResponse expected = AttachmentResponse.builder().id("a1").build();
        when(postAttachmentService.uploadAttachment("p1", file, "u1")).thenReturn(expected);

        AttachmentResponse result = attachmentService.uploadAttachment("p1", file, "u1");

        assertThat(result.getId()).isEqualTo("a1");
    }

    @Test
    void getByPost_delegates() {
        when(postAttachmentService.getByPost("p1")).thenReturn(List.of(AttachmentResponse.builder().id("a1").build()));

        List<AttachmentResponse> result = attachmentService.getByPost("p1");

        assertThat(result).hasSize(1);
    }

    @Test
    void deleteAttachment_delegates() {
        attachmentService.deleteAttachment("a1", "u1");

        verify(postAttachmentService).deleteAttachment("a1", "u1");
    }

    @Test
    void deleteAllForPost_delegates() {
        attachmentService.deleteAllForPost("p1");

        verify(postAttachmentService).deleteAllForPost("p1");
    }
}
