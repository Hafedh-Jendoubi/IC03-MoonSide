package tn.moonside.postservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.moonside.postservice.dtos.responses.ApiResponse;
import tn.moonside.postservice.dtos.responses.AttachmentResponse;
import tn.moonside.postservice.services.AttachmentService;

import java.util.List;

/**
 * REST API for post attachments.
 *
 * <pre>
 * POST   /posts/{postId}/attachments          — upload one file
 * GET    /posts/{postId}/attachments          — list all for a post
 * DELETE /posts/{postId}/attachments/{id}     — delete one (uploader only)
 * </pre>
 *
 * Files are uploaded as {@code multipart/form-data} with a single part named
 * {@code file}.  The service handles both small files (≤ 50 MB) and large
 * files (> 50 MB, up to 500 MB) transparently.
 */
@RestController
@RequestMapping("/posts/{postId}/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    /**
     * Upload a file and attach it to the post.
     *
     * <p>Accepts {@code multipart/form-data}; the file part must be named {@code file}.
     * The request size limit is configured in {@code application.properties}
     * ({@code spring.servlet.multipart.max-file-size=500MB}).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AttachmentResponse>> uploadAttachment(
            @PathVariable String postId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal String userId) {

        AttachmentResponse response = attachmentService.uploadAttachment(postId, file, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Attachment uploaded"));
    }

    /**
     * List all attachments for the given post.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> listAttachments(
            @PathVariable String postId) {

        return ResponseEntity.ok(
                ApiResponse.success(attachmentService.getByPost(postId)));
    }

    /**
     * Delete a single attachment.  Only the original uploader is authorised.
     */
    @DeleteMapping("/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable String postId,
            @PathVariable String attachmentId,
            @AuthenticationPrincipal String userId) {

        attachmentService.deleteAttachment(attachmentId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Attachment deleted"));
    }
}
