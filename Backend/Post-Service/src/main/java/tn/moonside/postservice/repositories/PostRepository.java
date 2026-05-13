package tn.moonside.postservice.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.enums.VisibilityType;

import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {

    // ── Existing queries (unchanged) ──────────────────────────────────────────

    Page<Post> findByPostVisibilityIn(List<VisibilityType> visibilities, Pageable pageable);

    Page<Post> findByAuthorId(String authorId, Pageable pageable);

    Page<Post> findByTeamId(String teamId, Pageable pageable);

    Page<Post> findByDepartmentId(String departmentId, Pageable pageable);

    Page<Post> findByTeamIdAndPostVisibilityIn(
            String teamId, List<VisibilityType> visibilities, Pageable pageable);

    Page<Post> findByDepartmentIdAndPostVisibilityIn(
            String departmentId, List<VisibilityType> visibilities, Pageable pageable);

    // ── New: personalised follow feed ─────────────────────────────────────────

    /**
     * Returns posts that belong to any of the given departments OR any of the
     * given teams, filtered to the supplied visibility types.
     *
     * This is the core query for the personalised "following" feed:
     *  - department posts visible to followers  → DEPARTMENT_ONLY, PUBLIC
     *  - team posts visible to followers        → TEAM_ONLY, PUBLIC
     *
     * Uses a raw $or query so MongoDB can evaluate both conditions in one pass.
     * The two lists must never both be empty — the service layer guards this.
     *
     * @param departmentIds list of department IDs the user follows (may be empty)
     * @param teamIds       list of team IDs the user follows (may be empty)
     * @param visibilities  allowed visibility values
     * @param pageable      paging / sorting
     */
    @Query("{ '$and': [ " +
            "  { '$or': [ " +
            "    { 'departmentId': { '$in': ?0 } }, " +
            "    { 'teamId':       { '$in': ?1 } }  " +
            "  ] }, " +
            "  { 'postVisibility': { '$in': ?2 } } " +
            "] }")
    Page<Post> findFollowingFeed(
            List<String> departmentIds,
            List<String> teamIds,
            List<VisibilityType> visibilities,
            Pageable pageable);
}
