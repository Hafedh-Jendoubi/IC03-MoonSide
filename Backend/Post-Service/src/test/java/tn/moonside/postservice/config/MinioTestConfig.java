package tn.moonside.postservice.config;

import io.minio.MinioClient;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Replaces the real MinioConfig bean during tests.
 *
 * The production MinioConfig calls bucketExists() and makeBucket() during
 * bean construction, which requires a live MinIO server. In CI there is no
 * MinIO server, so we provide a @Primary Mockito mock that satisfies every
 * injection point without opening any network connection.
 */
@TestConfiguration
public class MinioTestConfig {

    @Bean
    @Primary
    public MinioClient minioClient() {
        return Mockito.mock(MinioClient.class);
    }
}
