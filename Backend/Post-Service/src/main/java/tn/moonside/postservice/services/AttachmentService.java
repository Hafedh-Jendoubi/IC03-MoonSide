package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.dtos.responses.AttachmentResponse;
import tn.moonside.postservice.entities.Attachment;
import tn.moonside.postservice.repositories.AttachmentRepository;
import tn.moonside.postservice.repositories.PostRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final PostRepository postRepository;

    public AttachmentResponse addAttachment(String postId, String fileName,
                                            String fileURL, Long fileSizeBytes,
                                            String uploaderId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found: " + postId);
        }
        Attachment a = Attachment.builder()
                .postId(postId).uploaderId(uploaderId)
                .fileName(fileName).fileURL(fileURL).fileSizeBytes(fileSizeBytes)
                .build();
        return toResponse(attachmentRepository.save(a));
    }

    public List<AttachmentResponse> getByPost(String postId) {
        return attachmentRepository.findByPostId(postId).stream().map(this::toResponse).toList();
    }

    public void deleteAttachment(String attachmentId, String requesterId) {
        Attachment a = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));
        if (!a.getUploaderId().equals(requesterId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Not allowed to delete this attachment");
        }
        attachmentRepository.delete(a);
    }

    private AttachmentResponse toResponse(Attachment a) {
        return AttachmentResponse.builder()
                .id(a.getId()).postId(a.getPostId()).uploaderId(a.getUploaderId())
                .fileName(a.getFileName()).fileURL(a.getFileURL())
                .fileSizeBytes(a.getFileSizeBytes()).uploadedAt(a.getUploadedAt())
                .build();
    }
}
