package tn.moonside.eureka;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.times;

/**
 * Plain unit test (no Spring context) that pins down the contract of
 * EurekaApplication#main: it must simply delegate to SpringApplication.run
 * with this class and the given args, and must not swallow or transform
 * the arguments in any way.
 */
class EurekaApplicationMainMethodTest {

    @Test
    void mainDelegatesToSpringApplicationRunWithThisClassAndArgs() {
        try (MockedStatic<SpringApplication> mockedSpringApplication = mockStatic(SpringApplication.class)) {
            String[] args = {"--server.port=0", "--spring.profiles.active=test"};

            EurekaApplication.main(args);

            mockedSpringApplication.verify(
                    () -> SpringApplication.run(EurekaApplication.class, args),
                    times(1));
        }
    }
}
