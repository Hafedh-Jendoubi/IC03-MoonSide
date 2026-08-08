package tn.moonside.mediaservice.service;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import tn.moonside.mediaservice.dto.MediaResponse;
import tn.moonside.mediaservice.entity.MediaFile;
import tn.moonside.mediaservice.exception.MediaNotFoundException;
import tn.moonside.mediaservice.exception.MediaUploadException;
import tn.moonside.mediaservice.repository.MediaFileRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaServiceImplTest {

    @Mock
    private MinioClient minioClient;

    @Mock
    private MediaFileRepository repository;

    @InjectMocks
    private MediaServiceImpl mediaService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(mediaService, "bucket", "test-bucket");
        ReflectionTestUtils.setField(mediaService, "publicEndpoint", "http://localhost:9000");
    }

    @Test
    void upload_savesFileAndReturnsResponse() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.png", "image/png", "some-image-bytes".getBytes());

        when(repository.save(any(MediaFile.class))).thenAnswer(invocation -> {
            MediaFile mf = invocation.getArgument(0);
            mf.setId("m1");
            return mf;
        });

        MediaResponse response = mediaService.upload(file, "avatar", "user@example.com");

        assertThat(response.getId()).isEqualTo("m1");
        assertThat(response.getUploadedBy()).isEqualTo("user@example.com");
        assertThat(response.getOriginalFilename()).isEqualTo("photo.png");
        assertThat(response.getContentType()).isEqualTo("image/png");
        assertThat(response.getContext()).isEqualTo("AVATAR");
        assertThat(response.getUrl()).startsWith("http://localhost:9000/test-bucket/avatar/");
        assertThat(response.getUrl()).endsWith(".png");

        verify(minioClient).putObject(any(PutObjectArgs.class));
    }

    @Test
    void upload_buildsObjectKeyWithContextAndExtension() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "picture.jpeg", "image/jpeg", "bytes".getBytes());
        when(repository.save(any(MediaFile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ArgumentCaptor<PutObjectArgs> captor = ArgumentCaptor.forClass(PutObjectArgs.class);

        mediaService.upload(file, "POST_ATTACHMENT", "user@example.com");

        verify(minioClient).putObject(captor.capture());
        assertThat(captor.getValue().object()).startsWith("post_attachment/");
        assertThat(captor.getValue().object()).endsWith(".jpeg");
        assertThat(captor.getValue().bucket()).isEqualTo("test-bucket");
    }

    @Test
    void upload_missingExtension_fallsBackToContentTypeExtension() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "noextension", "image/webp", "bytes".getBytes());
        when(repository.save(any(MediaFile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ArgumentCaptor<PutObjectArgs> captor = ArgumentCaptor.forClass(PutObjectArgs.class);

        mediaService.upload(file, "general", "user@example.com");

        verify(minioClient).putObject(captor.capture());
        assertThat(captor.getValue().object()).endsWith(".webp");
    }

    @Test
    void upload_nullFile_throwsMediaUploadException() {
        assertThatThrownBy(() -> mediaService.upload(null, "avatar", "user@example.com"))
                .isInstanceOf(MediaUploadException.class)
                .hasMessageContaining("must not be empty");

        verifyNoInteractions(minioClient, repository);
    }

    @Test
    void upload_emptyFile_throwsMediaUploadException() {
        MockMultipartFile file = new MockMultipartFile("file", "a.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> mediaService.upload(file, "avatar", "user@example.com"))
                .isInstanceOf(MediaUploadException.class)
                .hasMessageContaining("must not be empty");

        verifyNoInteractions(minioClient, repository);
    }

    @Test
    void upload_unsupportedContentType_throwsMediaUploadException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "data".getBytes());

        assertThatThrownBy(() -> mediaService.upload(file, "avatar", "user@example.com"))
                .isInstanceOf(MediaUploadException.class)
                .hasMessageContaining("Unsupported file type");

        verifyNoInteractions(minioClient, repository);
    }

    @Test
    void upload_nullContentType_throwsMediaUploadException() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "a.png", null, "data".getBytes());

        assertThatThrownBy(() -> mediaService.upload(file, "avatar", "user@example.com"))
                .isInstanceOf(MediaUploadException.class)
                .hasMessageContaining("Unsupported file type");

        verifyNoInteractions(minioClient, repository);
    }

    @Test
    void upload_fileTooLarge_throwsMediaUploadException() {
        byte[] bigContent = new byte[11 * 1024 * 1024]; // 11 MB > 10 MB limit
        MockMultipartFile file = new MockMultipartFile(
                "file", "big.png", "image/png", bigContent);

        assertThatThrownBy(() -> mediaService.upload(file, "avatar", "user@example.com"))
                .isInstanceOf(MediaUploadException.class)
                .hasMessageContaining("10 MB limit");

        verifyNoInteractions(minioClient, repository);
    }

    @Test
    void upload_minioFailure_throwsMediaUploadException() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "a.png", "image/png", "data".getBytes());

        doThrow(new RuntimeException("connection refused")).when(minioClient).putObject(any(PutObjectArgs.class));

        assertThatThrownBy(() -> mediaService.upload(file, "avatar", "user@example.com"))
                .isInstanceOf(MediaUploadException.class)
                .hasMessageContaining("Failed to upload file to storage");

        verify(repository, never()).save(any());
    }

    @Test
    void getById_found_returnsResponse() {
        MediaFile mediaFile = MediaFile.builder()
                .id("m1")
                .uploadedBy("user@example.com")
                .originalFilename("photo.png")
                .contentType("image/png")
                .size(123L)
                .objectKey("avatar/abc.png")
                .url("http://localhost:9000/test-bucket/avatar/abc.png")
                .context("AVATAR")
                .build();
        when(repository.findById("m1")).thenReturn(Optional.of(mediaFile));

        MediaResponse response = mediaService.getById("m1");

        assertThat(response.getId()).isEqualTo("m1");
        assertThat(response.getUrl()).isEqualTo("http://localhost:9000/test-bucket/avatar/abc.png");
    }

    @Test
    void getById_notFound_throwsMediaNotFoundException() {
        when(repository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mediaService.getById("missing"))
                .isInstanceOf(MediaNotFoundException.class)
                .hasMessageContaining("missing");
    }
}
