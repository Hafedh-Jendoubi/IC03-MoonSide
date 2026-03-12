package tn.moonside.userservice.dtos.responses;

import tn.moonside.userservice.entities.TypeScope;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PermissionResponse {

    private String id;
    private String action;
    private TypeScope scopeType;
    private String description;
    private LocalDateTime createdAt;
}
