package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.dtos.responses.SurveyOptionResponse;
import tn.moonside.postservice.dtos.responses.SurveyResponse;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.entities.SurveyOption;
import tn.moonside.postservice.entities.SurveyVote;
import tn.moonside.postservice.enums.TypePosts;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.SurveyVoteRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SurveyService {

    private final PostRepository postRepository;
    private final SurveyVoteRepository surveyVoteRepository;

    /** Build the survey summary for a post (null if not a SURVEY post). */
    public SurveyResponse buildSurveyResponse(Post post, String requesterId) {
        if (post.getPostType() != TypePosts.SURVEY || post.getSurveyOptions() == null) return null;

        List<SurveyVote> votes = surveyVoteRepository.findByPostId(post.getId());
        int total = votes.size();

        Optional<SurveyVote> myVote = votes.stream()
                .filter(v -> v.getUserId().equals(requesterId))
                .findFirst();

        List<SurveyOptionResponse> optionResponses = post.getSurveyOptions().stream()
                .map(opt -> {
                    long count = votes.stream()
                            .filter(v -> v.getOptionId().equals(opt.getId()))
                            .count();
                    double pct = total == 0 ? 0.0 : (count * 100.0 / total);
                    return SurveyOptionResponse.builder()
                            .id(opt.getId())
                            .text(opt.getText())
                            .voteCount((int) count)
                            .percentage(Math.round(pct * 10.0) / 10.0)
                            .build();
                })
                .toList();

        return SurveyResponse.builder()
                .postId(post.getId())
                .surveyQuestion(post.getSurveyQuestion())
                .options(optionResponses)
                .totalVotes(total)
                .surveyOpen(post.isSurveyOpen())
                .userVotedOptionId(myVote.map(SurveyVote::getOptionId).orElse(null))
                .build();
    }

    /**
     * Cast or change a vote.
     * Returns the updated SurveyResponse.
     * Throws IllegalArgumentException on invalid optionId or closed survey.
     */
    public SurveyResponse vote(String postId, String userId, String optionId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));

        if (post.getPostType() != TypePosts.SURVEY) {
            throw new IllegalArgumentException("Post is not a survey");
        }
        if (!post.isSurveyOpen()) {
            throw new IllegalStateException("This survey is closed");
        }

        // Validate option exists
        boolean validOption = post.getSurveyOptions() != null &&
                post.getSurveyOptions().stream().anyMatch(o -> o.getId().equals(optionId));
        if (!validOption) {
            throw new IllegalArgumentException("Invalid optionId: " + optionId);
        }

        // Upsert the user's vote
        Optional<SurveyVote> existing = surveyVoteRepository.findByPostIdAndUserId(postId, userId);
        if (existing.isPresent()) {
            SurveyVote vote = existing.get();
            vote.setOptionId(optionId);
            surveyVoteRepository.save(vote);
        } else {
            surveyVoteRepository.save(
                    SurveyVote.builder()
                            .postId(postId)
                            .userId(userId)
                            .optionId(optionId)
                            .build()
            );
        }

        return buildSurveyResponse(post, userId);
    }

    /** Build SurveyOption entities with generated UUIDs from raw text labels. */
    public List<SurveyOption> buildOptions(List<String> optionTexts) {
        return optionTexts.stream()
                .map(text -> SurveyOption.builder()
                        .id(UUID.randomUUID().toString())
                        .text(text)
                        .build())
                .toList();
    }
}
