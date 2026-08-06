package tn.moonside.mediaservice.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.moonside.mediaservice.dto.ApiResponse;
import tn.moonside.mediaservice.dto.MediaResponse;
import tn.moonside.mediaservice.service.MediaService;

@RestController
@RequestMapping("/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaService mediaService;

    /**
     * Upload a file.
     *
     * Accepts multipart/form-data with:
     *   - file    : the binary file
     *   - context : logical context string (e.g. AVATAR, POST_ATTACHMENT)
     *
     * Returns the saved metadata including the public URL.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MediaResponse>> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "context", defaultValue = "GENERAL") String context,
            @AuthenticationPrincipal String uploaderEmail) {

        MediaResponse response = mediaService.upload(file, context, uploaderEmail);
        return ResponseEntity.ok(ApiResponse.success(response, "File uploaded successfully"));
    }

    /**
     * Fetch metadata for an uploaded file by its ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MediaResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(mediaService.getById(id)));
    }
}
