package tn.moonside.postservice.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import tn.moonside.postservice.entities.ReactionType;
import tn.moonside.postservice.repositories.ReactionTypeRepository;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ReactionTypeRepository reactionTypeRepository;

    private static final List<ReactionType> DEFAULT_REACTION_TYPES = List.of(
            ReactionType.builder().code("LIKE").emoji("👍").name("Like").description("Like a post or comment").build(),
            ReactionType.builder().code("LOVE").emoji("❤️").name("Love").description("Love a post or comment").build(),
            ReactionType.builder().code("HAHA").emoji("😂").name("Haha").description("Find a post or comment funny").build(),
            ReactionType.builder().code("WOW").emoji("😮").name("Wow").description("Be amazed by a post or comment").build(),
            ReactionType.builder().code("SAD").emoji("😢").name("Sad").description("Feel sad about a post or comment").build(),
            ReactionType.builder().code("ANGRY").emoji("😡").name("Angry").description("Be angry about a post or comment").build(),
            ReactionType.builder().code("CLAP").emoji("👏").name("Clap").description("Applaud a post or comment").build()
    );

    @Override
    public void run(String... args) {
        for (ReactionType rt : DEFAULT_REACTION_TYPES) {
            if (!reactionTypeRepository.existsByCode(rt.getCode())) {
                reactionTypeRepository.save(rt);
                log.info("Seeded reaction type: {} {}", rt.getCode(), rt.getEmoji());
            }
        }
    }
}
