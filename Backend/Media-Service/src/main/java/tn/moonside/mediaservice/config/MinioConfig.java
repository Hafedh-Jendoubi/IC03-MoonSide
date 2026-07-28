package tn.moonside.mediaservice.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MinioConfig {

    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Value("${minio.bucket}")
    private String bucket;

    // Only relevant for real AWS-style S3 providers (e.g. Backblaze B2) that
    // require a region. Local MinIO ignores this. Leave blank for local dev.
    @Value("${minio.region:}")
    private String region;

    @Bean
    public MinioClient minioClient() throws Exception {
        MinioClient.Builder builder = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey);

        if (region != null && !region.isBlank()) {
            builder.region(region);
        }

        MinioClient client = builder.build();

        // Create bucket if it doesn't exist (no-op if it already does, e.g. B2
        // buckets you created manually through the web console).
        boolean exists = client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!exists) {
            client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            log.info("Created bucket: {}", bucket);
        } else {
            log.info("Bucket already exists: {}", bucket);
        }

        // NOTE: no public-read bucket policy is applied here anymore.
        // The bucket is PRIVATE (Backblaze B2 requires card verification to
        // make a bucket public). Files are instead served through our own
        // /media/file/** streaming endpoint — see MediaController.
        return client;
    }
}
