package tn.moonside.userservice.dtos.responses;

import lombok.Builder;
import lombok.Data;

/** Minimal user projection — just enough to render an avatar/name in a list. */
@Data
@Builder
public class UserSummaryResponse {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String jobTitle;
    private String avatar;
}
