package tn.moonside.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        // application.properties points eureka.client.service-url.defaultZone
        // at the "eureka" docker-compose hostname, which doesn't resolve
        // outside the compose network. Disable the client for plain unit
        // test runs so context loading doesn't depend on that host.
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
class GatewayApplicationTests {

    @Test
    void contextLoads() {
    }

}
