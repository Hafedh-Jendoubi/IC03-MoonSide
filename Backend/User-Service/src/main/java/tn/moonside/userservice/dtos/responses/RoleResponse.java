package tn.moonside.userservice.dtos.responses;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RoleResponse {

    private String id;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private List<PermissionResponse> permissions;
}