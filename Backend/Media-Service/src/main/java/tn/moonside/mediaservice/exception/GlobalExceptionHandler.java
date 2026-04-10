package tn.moonside.mediaservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import tn.moonside.mediaservice.dto.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MediaUploadException.class)
    public ResponseEntity<ApiResponse<Void>> handleUploadException(MediaUploadException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(MediaNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFoundException(MediaNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        return ResponseEntity.internalServerError().body(ApiResponse.error("Internal server error: " + ex.getMessage()));
    }
}
