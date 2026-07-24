package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import tn.moonside.postservice.dtos.responses.AttachmentResponse;

import java.util.List;

/**
 * Thin façade kept for backward compatibility with any callers that were using
 * the old AttachmentService API.  All logic lives in {@link PostAttachmentService}.
 */
@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final PostAttachmentService postAttachmentService;

    public AttachmentResponse uploadAttachment(String postId,
                                               MultipartFile file,
                                               String uploaderId) {
        return postAttachmentService.uploadAttachment(postId, file, uploaderId);
    }

    public List<AttachmentResponse> getByPost(String postId) {
        return postAttachmentService.getByPost(postId);
    }

    public void deleteAttachment(String attachmentId, String requesterId) {
        postAttachmentService.deleteAttachment(attachmentId, requesterId);
    }

    public void deleteAllForPost(String postId) {
        postAttachmentService.deleteAllForPost(postId);
    }
}
