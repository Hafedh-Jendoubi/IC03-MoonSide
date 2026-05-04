package tn.moonside.organizationservice.dtos.responses;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSummary {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String avatar;
    private String jobTitle;
}
