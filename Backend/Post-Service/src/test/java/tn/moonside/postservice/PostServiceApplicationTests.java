package tn.moonside.postservice;

import io.minio.MinioClient;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class PostServiceApplicationTests {

    /**
     * Registers a Mockito mock for MinioClient directly in the Spring context,
     * preventing MinioConfig.minioClient() from ever being called.
     * This avoids the connection attempt to localhost:9000 in CI.
     */
    @MockBean
    MinioClient minioClient;

    @Test
    void contextLoads() {
    }
}