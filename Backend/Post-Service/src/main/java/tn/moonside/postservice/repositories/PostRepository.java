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

    // ── Pinned-first variants for Team and Department feeds ───────────────────

    /**
     * Returns posts for a team sorted with pinned posts first, then newest first.
     * MongoDB does not support multi-key sort through derived query names, so we
     * use a raw @Query and rely on the Pageable sort supplied by the service layer.
     */
    @Query("{ 'teamId': ?0, 'postVisibility': { '$in': ?1 } }")
    Page<Post> findByTeamIdAndPostVisibilityInSorted(
            String teamId, List<VisibilityType> visibilities, Pageable pageable);

    /**
     * Returns posts for a department sorted with pinned posts first, then newest first.
     */
    @Query("{ 'departmentId': ?0, 'postVisibility': { '$in': ?1 } }")
    Page<Post> findByDepartmentIdAndPostVisibilityInSorted(
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

    // ── New: connections feed ──────────────────────────────────────────────────

    /**
     * Returns posts that were either AUTHORED by one of the given users, OR
     * are among the given post IDs (posts a connection liked/commented on),
     * filtered to the supplied visibility types.
     *
     * Used by the "Connections" feed tab: what your connections posted,
     * commented on, or reacted to.
     *
     * @param authorIds IDs of the user's connections (never empty — caller guards this)
     * @param postIds   IDs of posts a connection reacted to or commented on (may be a
     *                  placeholder single-element list when there is no such activity)
     * @param visibilities allowed visibility values
     */
    @Query("{ '$and': [ " +
            "  { '$or': [ " +
            "    { 'authorId': { '$in': ?0 } }, " +
            "    { '_id':      { '$in': ?1 } }  " +
            "  ] }, " +
            "  { 'postVisibility': { '$in': ?2 } } " +
            "] }")
    Page<Post> findConnectionsFeed(
            List<String> authorIds,
            List<String> postIds,
            List<VisibilityType> visibilities,
            Pageable pageable);
}
