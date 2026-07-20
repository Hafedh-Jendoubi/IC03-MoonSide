package tn.moonside.postservice.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import tn.moonside.postservice.dtos.responses.PostStatsResponse;
import tn.moonside.postservice.entities.Comment;
import tn.moonside.postservice.entities.Post;
import tn.moonside.postservice.entities.Reaction;
import tn.moonside.postservice.entities.ReactionType;
import tn.moonside.postservice.repositories.CommentRepository;
import tn.moonside.postservice.repositories.PostRepository;
import tn.moonside.postservice.repositories.ReactionRepository;
import tn.moonside.postservice.repositories.ReactionTypeRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Computes live statistics for the admin back-office dashboard directly from
 * the posts / comments / reactions collections. Deliberately avoids Mongo
 * aggregation-pipeline date operators (whose exact API varies by Spring Data
 * version) in favour of simple field-projected queries grouped in memory —
 * safe and fast enough at the scale of an internal company workspace.
 */
@Service
@RequiredArgsConstructor
public class PostStatsService {

    private static final DateTimeFormatter DAY_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final MongoTemplate mongoTemplate;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final ReactionTypeRepository reactionTypeRepository;

    public PostStatsResponse getStats() {
        long totalPosts = postRepository.count();
        long totalComments = commentRepository.count();
        long totalReactions = reactionRepository.count();

        LocalDate today = LocalDate.now();
        LocalDateTime last30 = today.minusDays(29).atStartOfDay();

        List<LocalDateTime> postDates = createdAtSince(Post.class, last30);
        List<LocalDateTime> commentDates = createdAtSince(Comment.class, last30);
        List<LocalDateTime> reactionDates = createdAtSince(Reaction.class, last30);

        Map<String, Long> postsPerDayMap = groupByDay(postDates);
        Map<String, Long> commentsPerDayMap = groupByDay(commentDates);
        Map<String, Long> reactionsPerDayMap = groupByDay(reactionDates);

        String todayKey = today.format(DAY_FMT);
        long postsToday = postsPerDayMap.getOrDefault(todayKey, 0L);
        long commentsToday = commentsPerDayMap.getOrDefault(todayKey, 0L);
        long reactionsToday = reactionsPerDayMap.getOrDefault(todayKey, 0L);

        List<PostStatsResponse.DailyCount> postsPerDay = fillDailySeries(postsPerDayMap, 14);
        List<PostStatsResponse.DailyCount> commentsPerDay = fillDailySeries(commentsPerDayMap, 14);
        List<PostStatsResponse.DailyCount> reactionsPerDay = fillDailySeries(reactionsPerDayMap, 14);

        Map<Integer, Long> hourly = new TreeMap<>();
        for (int h = 0; h < 24; h++) hourly.put(h, 0L);
        mergeHourly(hourly, groupByHour(postDates));
        mergeHourly(hourly, groupByHour(commentDates));
        mergeHourly(hourly, groupByHour(reactionDates));

        List<PostStatsResponse.HourlyCount> activityByHour = hourly.entrySet().stream()
                .map(e -> PostStatsResponse.HourlyCount.builder().hour(e.getKey()).count(e.getValue()).build())
                .collect(Collectors.toList());

        List<PostStatsResponse.NamedCount> postsByType = postsByType();
        List<PostStatsResponse.ReactionBreakdown> reactionsByType = reactionsByType();

        return PostStatsResponse.builder()
                .totalPosts(totalPosts)
                .totalComments(totalComments)
                .totalReactions(totalReactions)
                .postsToday(postsToday)
                .commentsToday(commentsToday)
                .reactionsToday(reactionsToday)
                .avgCommentsPerPost(totalPosts == 0 ? 0 : round(totalComments / (double) totalPosts))
                .avgReactionsPerPost(totalPosts == 0 ? 0 : round(totalReactions / (double) totalPosts))
                .postsPerDay(postsPerDay)
                .commentsPerDay(commentsPerDay)
                .reactionsPerDay(reactionsPerDay)
                .activityByHour(activityByHour)
                .postsByType(postsByType)
                .reactionsByType(reactionsByType)
                .build();
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private <T> List<LocalDateTime> createdAtSince(Class<T> entityClass, LocalDateTime from) {
        Query query = new Query(Criteria.where("createdAt").gte(from));
        query.fields().include("createdAt");
        return mongoTemplate.find(query, entityClass).stream()
                .map(this::extractCreatedAt)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private LocalDateTime extractCreatedAt(Object entity) {
        if (entity instanceof Post p) return p.getCreatedAt();
        if (entity instanceof Comment c) return c.getCreatedAt();
        if (entity instanceof Reaction r) return r.getCreatedAt();
        return null;
    }

    private Map<String, Long> groupByDay(List<LocalDateTime> dates) {
        return dates.stream()
                .collect(Collectors.groupingBy(d -> d.toLocalDate().format(DAY_FMT), Collectors.counting()));
    }

    private Map<Integer, Long> groupByHour(List<LocalDateTime> dates) {
        return dates.stream()
                .collect(Collectors.groupingBy(LocalDateTime::getHour, Collectors.counting()));
    }

    private void mergeHourly(Map<Integer, Long> target, Map<Integer, Long> source) {
        source.forEach((k, v) -> target.merge(k, v, Long::sum));
    }

    private List<PostStatsResponse.DailyCount> fillDailySeries(Map<String, Long> counts, int days) {
        List<PostStatsResponse.DailyCount> series = new ArrayList<>();
        LocalDate start = LocalDate.now().minusDays(days - 1L);
        for (int i = 0; i < days; i++) {
            String key = start.plusDays(i).format(DAY_FMT);
            series.add(PostStatsResponse.DailyCount.builder()
                    .date(key)
                    .count(counts.getOrDefault(key, 0L))
                    .build());
        }
        return series;
    }

    private List<PostStatsResponse.NamedCount> postsByType() {
        List<Post> posts = mongoTemplate.findAll(Post.class);
        Map<String, Long> byType = posts.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getPostType() != null ? p.getPostType().name() : "UNKNOWN",
                        Collectors.counting()));
        return byType.entrySet().stream()
                .map(e -> PostStatsResponse.NamedCount.builder().name(e.getKey()).count(e.getValue()).build())
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());
    }

    private List<PostStatsResponse.ReactionBreakdown> reactionsByType() {
        List<Reaction> reactions = mongoTemplate.findAll(Reaction.class);
        Map<String, Long> byType = reactions.stream()
                .collect(Collectors.groupingBy(Reaction::getReactionTypeId, Collectors.counting()));

        Map<String, ReactionType> typesById = reactionTypeRepository.findAll().stream()
                .collect(Collectors.toMap(ReactionType::getId, rt -> rt));

        return byType.entrySet().stream()
                .map(e -> {
                    ReactionType rt = typesById.get(e.getKey());
                    return PostStatsResponse.ReactionBreakdown.builder()
                            .code(rt != null ? rt.getCode() : "UNKNOWN")
                            .emoji(rt != null ? rt.getEmoji() : "❓")
                            .name(rt != null ? rt.getName() : "Unknown")
                            .count(e.getValue())
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .collect(Collectors.toList());
    }
}
