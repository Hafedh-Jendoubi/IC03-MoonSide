package tn.moonside.userservice.repositories;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;
import tn.moonside.userservice.entities.UserRole;

import java.util.ArrayList;
import java.util.List;

/**
 * Handles the case where userId / roleId were stored as ObjectId in MongoDB
 * (legacy data) instead of the String that the entity now expects.
 *
 * Strategy: try the plain String query first; if it returns nothing, retry
 * treating the value as an ObjectId. This makes the code work for BOTH old
 * ObjectId-stored records and new String-stored records transparently.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserRoleRepositoryCustomImpl implements UserRoleRepositoryCustom {

    private final MongoTemplate mongoTemplate;

    @Override
    public List<UserRole> findByUserIdFlexible(String userId) {
        // Always query BOTH string and ObjectId representations and merge,
        // because different records may have been stored in different formats
        // (e.g. legacy data stored as ObjectId, newer data stored as String).
        // An early-return on the first non-empty result would miss records
        // stored in the other format.
        List<UserRole> results = new ArrayList<>();

        // Query by String value
        Query qString = Query.query(Criteria.where("userId").is(userId));
        results.addAll(mongoTemplate.find(qString, UserRole.class));

        // Also query by ObjectId if the value is a valid ObjectId hex string
        if (ObjectId.isValid(userId)) {
            Query qObjectId = Query.query(Criteria.where("userId").is(new ObjectId(userId)));
            List<UserRole> objectIdResults = mongoTemplate.find(qObjectId, UserRole.class);
            // Deduplicate by document id to avoid returning the same record twice
            // (in case MongoDB returns the same doc for both queries)
            objectIdResults.stream()
                    .filter(r -> results.stream().noneMatch(existing -> existing.getId().equals(r.getId())))
                    .forEach(results::add);
        }

        return results;
    }

    @Override
    public void deleteByUserIdAndRoleIdFlexible(String userId, String roleId) {
        List<Criteria> userIdCriteria = buildIdCriteria("userId", userId);
        List<Criteria> roleIdCriteria = buildIdCriteria("roleId", roleId);

        for (Criteria uc : userIdCriteria) {
            for (Criteria rc : roleIdCriteria) {
                Query q = Query.query(new Criteria().andOperator(uc, rc));
                long deleted = mongoTemplate.remove(q, UserRole.class).getDeletedCount();
                if (deleted > 0) return;
            }
        }
    }

    @Override
    public boolean existsByUserIdAndRoleIdFlexible(String userId, String roleId) {
        List<Criteria> userIdCriteria = buildIdCriteria("userId", userId);
        List<Criteria> roleIdCriteria = buildIdCriteria("roleId", roleId);

        for (Criteria uc : userIdCriteria) {
            for (Criteria rc : roleIdCriteria) {
                Query q = Query.query(new Criteria().andOperator(uc, rc));
                if (mongoTemplate.exists(q, UserRole.class)) return true;
            }
        }
        return false;
    }

    /** Returns criteria covering both String and ObjectId representations. */
    private List<Criteria> buildIdCriteria(String field, String value) {
        List<Criteria> list = new ArrayList<>();
        list.add(Criteria.where(field).is(value));
        if (ObjectId.isValid(value)) {
            list.add(Criteria.where(field).is(new ObjectId(value)));
        }
        return list;
    }
}