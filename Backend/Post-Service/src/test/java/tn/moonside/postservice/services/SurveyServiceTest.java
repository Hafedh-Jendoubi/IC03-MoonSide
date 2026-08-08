package tn.moonside.postservice.services;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.moonside.postservice.dtos.responses.SurveyResponse;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.entities.SurveyOption;
import tn.moonside.postservice.entities.SurveyVote;
import tn.moonside.postservice.enums.TypePosts;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.SurveyVoteRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SurveyServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private SurveyVoteRepository surveyVoteRepository;

    @InjectMocks
    private SurveyService surveyService;

    private Post surveyPost;
    private SurveyOption opt1;
    private SurveyOption opt2;

    @BeforeEach
    void setUp() {
        opt1 = SurveyOption.builder().id("o1").text("Yes").build();
        opt2 = SurveyOption.builder().id("o2").text("No").build();
        surveyPost = Post.builder().id("p1").postType(TypePosts.SURVEY)
                .surveyQuestion("Do you like it?")
                .surveyOptions(List.of(opt1, opt2))
                .surveyOpen(true)
                .build();
    }

    @Test
    void buildSurveyResponse_notASurvey_returnsNull() {
        Post regular = Post.builder().id("p2").postType(TypePosts.DISCUSSION).build();

        SurveyResponse response = surveyService.buildSurveyResponse(regular, "u1");

        assertThat(response).isNull();
    }

    @Test
    void buildSurveyResponse_noVotes_zeroPercentages() {
        when(surveyVoteRepository.findByPostId("p1")).thenReturn(List.of());

        SurveyResponse response = surveyService.buildSurveyResponse(surveyPost, "u1");

        assertThat(response.getTotalVotes()).isZero();
        assertThat(response.getOptions()).hasSize(2);
        assertThat(response.getOptions().get(0).getPercentage()).isZero();
        assertThat(response.getUserVotedOptionId()).isNull();
    }

    @Test
    void buildSurveyResponse_withVotes_computesPercentages() {
        SurveyVote v1 = SurveyVote.builder().postId("p1").userId("u1").optionId("o1").build();
        SurveyVote v2 = SurveyVote.builder().postId("p1").userId("u2").optionId("o1").build();
        SurveyVote v3 = SurveyVote.builder().postId("p1").userId("u3").optionId("o2").build();

        when(surveyVoteRepository.findByPostId("p1")).thenReturn(List.of(v1, v2, v3));

        SurveyResponse response = surveyService.buildSurveyResponse(surveyPost, "u1");

        assertThat(response.getTotalVotes()).isEqualTo(3);
        assertThat(response.getUserVotedOptionId()).isEqualTo("o1");
        assertThat(response.getOptions().get(0).getVoteCount()).isEqualTo(2);
        assertThat(response.getOptions().get(0).getPercentage()).isEqualTo(66.7);
    }

    @Test
    void vote_newVote_success() {
        when(postRepository.findById("p1")).thenReturn(Optional.of(surveyPost));
        when(surveyVoteRepository.findByPostIdAndUserId("p1", "u1")).thenReturn(Optional.empty());
        when(surveyVoteRepository.findByPostId("p1")).thenReturn(List.of());

        SurveyResponse response = surveyService.vote("p1", "u1", "o1");

        verify(surveyVoteRepository).save(any(SurveyVote.class));
        assertThat(response).isNotNull();
    }

    @Test
    void vote_existingVote_updatesInPlace() {
        SurveyVote existing = SurveyVote.builder().id("v1").postId("p1").userId("u1").optionId("o2").build();
        when(postRepository.findById("p1")).thenReturn(Optional.of(surveyPost));
        when(surveyVoteRepository.findByPostIdAndUserId("p1", "u1")).thenReturn(Optional.of(existing));
        when(surveyVoteRepository.findByPostId("p1")).thenReturn(List.of());

        surveyService.vote("p1", "u1", "o1");

        verify(surveyVoteRepository).save(existing);
        assertThat(existing.getOptionId()).isEqualTo("o1");
    }

    @Test
    void vote_postNotFound_throws() {
        when(postRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> surveyService.vote("missing", "u1", "o1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void vote_notASurvey_throws() {
        Post regular = Post.builder().id("p2").postType(TypePosts.DISCUSSION).build();
        when(postRepository.findById("p2")).thenReturn(Optional.of(regular));

        assertThatThrownBy(() -> surveyService.vote("p2", "u1", "o1"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void vote_closedSurvey_throws() {
        Post closed = Post.builder().id("p3").postType(TypePosts.SURVEY)
                .surveyOptions(List.of(opt1)).surveyOpen(false).build();
        when(postRepository.findById("p3")).thenReturn(Optional.of(closed));

        assertThatThrownBy(() -> surveyService.vote("p3", "u1", "o1"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void vote_invalidOption_throws() {
        when(postRepository.findById("p1")).thenReturn(Optional.of(surveyPost));

        assertThatThrownBy(() -> surveyService.vote("p1", "u1", "bad-option"))
                .isInstanceOf(IllegalArgumentException.class);
        verify(surveyVoteRepository, never()).save(any());
    }

    @Test
    void buildOptions_generatesUuidsForEachText() {
        List<SurveyOption> options = surveyService.buildOptions(List.of("A", "B", "C"));

        assertThat(options).hasSize(3);
        assertThat(options).extracting(SurveyOption::getText).containsExactly("A", "B", "C");
        assertThat(options).allSatisfy(o -> assertThat(o.getId()).isNotBlank());
    }
}
