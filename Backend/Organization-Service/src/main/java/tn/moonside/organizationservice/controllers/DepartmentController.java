package tn.moonside.organizationservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.moonside.organizationservice.dtos.requests.AssignManagerRequest;
import tn.moonside.organizationservice.dtos.requests.DepartmentRequest;
import tn.moonside.organizationservice.dtos.responses.ApiResponse;
import tn.moonside.organizationservice.dtos.responses.DepartmentResponse;
import tn.moonside.organizationservice.services.DepartmentService;

import java.util.List;

@RestController
@RequestMapping("/organizations/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    // ── Public / authenticated reads ─────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getAllDepartments() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getAllDepartments()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getActiveDepartments() {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getActiveDepartments()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getDepartmentById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(departmentService.getDepartmentById(id)));
    }

    // ── Admin mutations ───────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<ApiResponse<DepartmentResponse>> createDepartment(
            @Valid @RequestBody DepartmentRequest request) {
        DepartmentResponse created = departmentService.createDepartment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Department created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DepartmentResponse>> updateDepartment(
            @PathVariable String id,
            @Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                departmentService.updateDepartment(id, request), "Department updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable String id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Department deleted successfully"));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<DepartmentResponse>> deactivate(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(
                departmentService.deactivateDepartment(id), "Department deactivated"));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<DepartmentResponse>> activate(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(
                departmentService.activateDepartment(id), "Department activated"));
    }

    @PatchMapping("/{id}/manager")
    public ResponseEntity<ApiResponse<DepartmentResponse>> assignManager(
            @PathVariable String id,
            @Valid @RequestBody AssignManagerRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                departmentService.assignManager(id, request), "Manager assigned successfully"));
    }

    @DeleteMapping("/{id}/manager")
    public ResponseEntity<ApiResponse<DepartmentResponse>> removeManager(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(
                departmentService.removeManager(id), "Manager removed successfully"));
    }
}
