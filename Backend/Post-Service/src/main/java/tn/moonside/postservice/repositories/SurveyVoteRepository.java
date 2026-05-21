package tn.moonside.postservice.repositories;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.moonside.postservice.entities.SurveyVote;

import java.util.List;
import java.util.Optional;

public interface SurveyVoteRepository extends MongoRepository<SurveyVote, String> {

    Optional<SurveyVote> findByPostIdAndUserId(String postId, String userId);

    List<SurveyVote> findByPostId(String postId);

    void deleteByPostId(String postId);
}
