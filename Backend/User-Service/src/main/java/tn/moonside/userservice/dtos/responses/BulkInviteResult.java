package tn.moonside.userservice.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkInviteResult {

    private int total;
    private int succeeded;
    private int skipped;
    private int failed;
    private List<RowResult> rows;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RowResult {
        private int rowNumber;
        private String email;
        private String status;   // "SUCCESS" | "SKIPPED" | "FAILED"
        private String message;
    }
}
