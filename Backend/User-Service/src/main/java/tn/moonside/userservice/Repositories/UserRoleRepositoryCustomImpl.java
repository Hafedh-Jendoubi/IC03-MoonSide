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
        // Try String match first
        Query q = Query.query(Criteria.where("userId").is(userId));
        List<UserRole> results = mongoTemplate.find(q, UserRole.class);

        if (!results.isEmpty()) return results;

        // Fallback: stored as ObjectId
        if (ObjectId.isValid(userId)) {
            Query q2 = Query.query(Criteria.where("userId").is(new ObjectId(userId)));
            results = mongoTemplate.find(q2, UserRole.class);
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
