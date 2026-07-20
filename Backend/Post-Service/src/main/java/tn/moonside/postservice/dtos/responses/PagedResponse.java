package tn.moonside.postservice.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.io.Serializable;
import java.util.List;

/**
 * A plain, POJO stand-in for Spring's {@link Page}.
 *
 * Why this exists: {@link org.springframework.data.domain.PageImpl} has no
 * default constructor and no Jackson creator, so when it's cached with
 * {@code GenericJackson2JsonRedisSerializer} (default typing / "@class"
 * based), Jackson can serialize it (it just walks the getters) but can
 * NEVER deserialize it back — there's no way to construct the instance.
 * That's exactly what caused:
 *
 *   "Cannot construct instance of `org.springframework.data.domain.PageImpl`
 *    (no Creators, like default constructor, exist)"
 *
 * on the very first cache read after a page got cached (e.g. right after
 * a feed reload following {@code createPost}'s cache eviction).
 *
 * The fix is to never hand PageImpl to the Redis serializer. Any
 * {@code @Cacheable} method that used to return {@code Page<T>} should
 * return {@code PagedResponse<T>} instead — a normal bean with a no-arg
 * constructor and setters, which Jackson can round-trip with no special
 * handling. It carries the same fields the frontend already expects
 * (see Frontend/src/lib/api/types/common.ts: PageResponse<T>), so the
 * JSON shape returned to clients is unchanged.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> implements Serializable {

    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int number;
    private int size;
    private boolean first;
    private boolean last;
    private boolean empty;

    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize(),
                page.isFirst(),
                page.isLast(),
                page.isEmpty());
    }
}