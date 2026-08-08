package tn.moonside.gateway;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;

class GatewayApplicationMainMethodTest {

    @Test
    void mainDelegatesToSpringApplicationRunWithThisClassAndArgs() {
        try (MockedStatic<SpringApplication> mockedSpringApplication = mockStatic(SpringApplication.class)) {
            String[] args = {"--server.port=0"};

            GatewayApplication.main(args);

            mockedSpringApplication.verify(
                    () -> SpringApplication.run(GatewayApplication.class, args),
                    times(1));
        }
    }
}
