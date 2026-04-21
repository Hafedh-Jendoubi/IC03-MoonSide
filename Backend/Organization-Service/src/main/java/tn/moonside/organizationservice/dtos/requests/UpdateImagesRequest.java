package tn.moonside.organizationservice.dtos.requests;

import lombok.Data;

/**
 * Used by PATCH /avatar and PATCH /banner endpoints.
 * Either field can be null to clear it; omit the field to leave unchanged.
 */
@Data
public class UpdateImagesRequest {
    /** New image URL (from media-service). Pass null to remove. */
    private String url;
}
