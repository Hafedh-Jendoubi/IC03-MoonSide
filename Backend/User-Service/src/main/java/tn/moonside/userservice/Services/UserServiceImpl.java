package tn.moonside.userservice.services;

import tn.moonside.userservice.dtos.requests.AssignRoleRequest;
import tn.moonside.userservice.dtos.requests.InviteUserRequest;
import tn.moonside.userservice.dtos.requests.UpdateUserRequest;
import tn.moonside.userservice.dtos.responses.UserResponse;
import tn.moonside.userservice.exceptions.DuplicateResourceException;
import tn.moonside.userservice.exceptions.ResourceNotFoundException;
import tn.moonside.userservice.entities.Role;
import tn.moonside.userservice.entities.User;
import tn.moonside.userservice.entities.UserRole;
import tn.moonside.userservice.repositories.RoleRepository;
import tn.moonside.userservice.repositories.UserRepository;
import tn.moonside.userservice.repositories.UserRoleRepository;
import tn.moonside.userservice.repositories.PermissionRoleRepository;
import tn.moonside.userservice.repositories.PermissionRepository;
import tn.moonside.userservice.entities.PermissionRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import tn.moonside.userservice.dtos.responses.BulkInviteResult;
import java.io.InputStream;
import java.util.ArrayList;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final PermissionRoleRepository permissionRoleRepository;
    private final PermissionRepository permissionRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${app.name:WorkSphere}")
    private String appName;

    @Value("${spring.mail.username}")
    private String mailFrom;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    // ─── Invite User ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public UserResponse inviteUser(InviteUserRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already registered: " + email);
        }

        // Derive first/last name from email local part (e.g. "john.doe@..." → John, Doe)
        String localPart = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
        String[] nameParts = localPart.split("[._\\-]+");
        String firstName = capitalize(nameParts[0]);
        String lastName  = nameParts.length > 1 ? capitalize(nameParts[nameParts.length - 1]) : "User";

        // Generate a random password satisfying backend policy: upper + lower + digit + special, length 8
        String rawPassword = generateSecurePassword();

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .firstName(firstName)
                .lastName(lastName)
                .isActive(true)
                .emailVerified(true)
                .mustChangePassword(true)
                .build();

        User saved = userRepository.save(user);
        log.info("Admin invited new user: {}", saved.getEmail());

        // Auto-assign EMPLOYEE role
        roleRepository.findByName("EMPLOYEE").ifPresent(role -> {
            UserRole userRole = UserRole.builder()
                    .userId(saved.getId())
                    .roleId(role.getId())
                    .build();
            userRoleRepository.save(userRole);
        });

        sendInvitationEmail(saved.getEmail(), saved.getFirstName(), rawPassword);

        // Log the invitation
        auditLogService.log(saved.getId(), saved.getId(), "USER",
                "USER_INVITED", "User invited: " + saved.getEmail(), true, null, null, null);

        return mapToUserResponse(saved);
    }


    // ─── Bulk Invite from Excel ───────────────────────────────────────────────

    @Override
    public BulkInviteResult bulkInviteFromExcel(MultipartFile file) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (!filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
            throw new IllegalArgumentException("Only .xlsx and .xls files are supported.");
        }

        List<BulkInviteResult.RowResult> rows = new ArrayList<>();
        int succeeded = 0, skipped = 0, failed = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = filename.endsWith(".xlsx") ? new XSSFWorkbook(is) : new HSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("The Excel file appears to be empty.");
            }

            // Auto-detect the email column index
            int emailColIndex = -1;
            for (Cell cell : headerRow) {
                String header = cell.getStringCellValue().trim().toLowerCase();
                if (header.contains("email")) {
                    emailColIndex = cell.getColumnIndex();
                    break;
                }
            }
            if (emailColIndex == -1) {
                throw new IllegalArgumentException(
                    "No email column found. Please ensure one column header contains the word 'email'.");
            }

            // Process data rows (skip header at index 0)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Cell emailCell = row.getCell(emailColIndex);
                if (emailCell == null) continue;

                String rawEmail = "";
                if (emailCell.getCellType() == CellType.STRING) {
                    rawEmail = emailCell.getStringCellValue().trim();
                } else if (emailCell.getCellType() == CellType.NUMERIC) {
                    rawEmail = String.valueOf((long) emailCell.getNumericCellValue()).trim();
                }

                if (rawEmail.isEmpty()) continue;

                int rowNum = i + 1; // 1-based for user display
                try {
                    InviteUserRequest req = new InviteUserRequest();
                    req.setEmail(rawEmail);
                    inviteUser(req);
                    rows.add(BulkInviteResult.RowResult.builder()
                            .rowNumber(rowNum).email(rawEmail)
                            .status("SUCCESS").message("Invitation sent").build());
                    succeeded++;
                } catch (DuplicateResourceException e) {
                    rows.add(BulkInviteResult.RowResult.builder()
                            .rowNumber(rowNum).email(rawEmail)
                            .status("SKIPPED").message("Already registered").build());
                    skipped++;
                } catch (Exception e) {
                    rows.add(BulkInviteResult.RowResult.builder()
                            .rowNumber(rowNum).email(rawEmail)
                            .status("FAILED").message(e.getMessage()).build());
                    failed++;
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Excel file: " + e.getMessage(), e);
        }

        return BulkInviteResult.builder()
                .total(succeeded + skipped + failed)
                .succeeded(succeeded)
                .skipped(skipped)
                .failed(failed)
                .rows(rows)
                .build();
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    private String generateSecurePassword() {
        String upper   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lower   = "abcdefghijklmnopqrstuvwxyz";
        String digits  = "0123456789";
        String special = "@$!%*?&_.#";
        String all     = upper + lower + digits + special;

        SecureRandom rng = new SecureRandom();
        char[] password = new char[8];
        password[0] = upper.charAt(rng.nextInt(upper.length()));
        password[1] = lower.charAt(rng.nextInt(lower.length()));
        password[2] = digits.charAt(rng.nextInt(digits.length()));
        password[3] = special.charAt(rng.nextInt(special.length()));
        for (int i = 4; i < 8; i++) {
            password[i] = all.charAt(rng.nextInt(all.length()));
        }
        for (int i = 7; i > 0; i--) {
            int j = rng.nextInt(i + 1);
            char tmp = password[i]; password[i] = password[j]; password[j] = tmp;
        }
        return new String(password);
    }

    private void sendInvitationEmail(String to, String firstName, String rawPassword) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mailFrom);
        msg.setTo(to);
        msg.setSubject(appName + " — Your account has been created");
        msg.setText(
            "Hi " + firstName + ",\n\n" +
            "An administrator has created an account for you on " + appName + ".\n\n" +
            "Your login credentials are:\n" +
            "  Email:    " + to + "\n" +
            "  Password: " + rawPassword + "\n\n" +
            "For security reasons, please change your password after your first login.\n\n" +
            "Click the link below to log in:\n" +
            "  " + frontendUrl + "/login\n\n" +
            "If you did not expect this email, please contact your administrator.\n\n" +
            "— The " + appName + " Team"
        );
        mailSender.send(msg);
        log.info("Invitation email sent to {}", to);
    }

    @Override
    public UserResponse getUserById(String id) {
        return mapToUserResponse(findUserById(id));
    }

    @Override
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return mapToUserResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserResponse updateAvatar(String email, String avatarUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        String oldAvatar = user.getAvatar();
        user.setAvatar(avatarUrl);
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        log.info("Updated avatar for user: {}", saved.getId());

        String action = (avatarUrl == null) ? "AVATAR_DELETE" : "AVATAR_UPDATE";
        String desc   = (avatarUrl == null)
                ? "Avatar removed for " + email
                : "Avatar updated for " + email;
        auditLogService.log(saved.getId(), saved.getId(), "USER",
                action, desc, true, oldAvatar, avatarUrl, null);

        return mapToUserResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(String id, UpdateUserRequest request, String currentUserEmail) {
        User user = findUserById(id);

        // Capture old snapshot for audit
        String oldSnapshot = toSnapshot(user);

        if (request.getFirstName()   != null) user.setFirstName(request.getFirstName());
        if (request.getLastName()    != null) user.setLastName(request.getLastName());
        if (request.getBirthDate()   != null) user.setBirthDate(request.getBirthDate());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getJobTitle()    != null) user.setJobTitle(request.getJobTitle());
        if (request.getBio()         != null) user.setBio(request.getBio());
        if (request.getAvatar()      != null) user.setAvatar(request.getAvatar());
        user.setUpdatedBy(currentUserEmail);
        user.setUpdatedAt(LocalDateTime.now());
        User updated = userRepository.save(user);
        log.info("Updated user: {}", updated.getId());

        auditLogService.log(updated.getId(), updated.getId(), "USER",
                "PROFILE_UPDATE",
                "Profile updated for " + updated.getEmail() + " by " + currentUserEmail,
                true, oldSnapshot, toSnapshot(updated), null);

        return mapToUserResponse(updated);
    }

    @Override
    @Transactional
    public void deleteUser(String id) {
        User user = findUserById(id);
        userRoleRepository.findByUserIdFlexible(id).forEach(userRoleRepository::delete);
        userRepository.delete(user);
        log.info("Deleted user: {}", id);
        auditLogService.log(id, id, "USER",
                "USER_DELETED", "User deleted: " + user.getEmail(), true, null, null, null);
    }

    @Override
    @Transactional
    public void assignRole(String userId, AssignRoleRequest request) {
        User user = findUserById(userId);
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.getRoleId()));

        String scopeId = request.getScopeId() != null ? request.getScopeId() : "GLOBAL";
        boolean alreadyAssigned = userRoleRepository.existsByUserIdAndRoleIdFlexible(userId, request.getRoleId());
        if (alreadyAssigned) {
            throw new DuplicateResourceException("Role already assigned to user with this scope");
        }

        UserRole userRole = UserRole.builder()
                .userId(userId)
                .roleId(request.getRoleId())
                .scopeType(request.getScopeType())
                .scopeId(scopeId)
                .build();
        userRoleRepository.save(userRole);
        log.info("Assigned role {} to user {}", request.getRoleId(), userId);

        auditLogService.log(userId, userId, "USER",
                "ROLE_ASSIGNED",
                "Role '" + role.getName() + "' assigned to " + user.getEmail(),
                true, null, role.getName(), null);
    }

    @Override
    @Transactional
    public void revokeRole(String userId, String roleId) {
        User user = findUserById(userId);
        Role role = findRoleById(roleId).orElse(null);
        userRoleRepository.deleteByUserIdAndRoleIdFlexible(userId, roleId);
        log.info("Revoked role {} from user {}", roleId, userId);

        auditLogService.log(userId, userId, "USER",
                "ROLE_REVOKED",
                "Role '" + (role != null ? role.getName() : roleId) + "' revoked from " + user.getEmail(),
                true, (role != null ? role.getName() : roleId), null, null);
    }

    @Override
    @Transactional
    public void revokeRoleByName(String userId, String roleName) {
        User user = findUserById(userId);
        roleRepository.findByName(roleName).ifPresent(role -> {
            userRoleRepository.deleteByUserIdAndRoleIdFlexible(userId, role.getId());
            log.info("Revoked role '{}' from user {}", roleName, userId);
            auditLogService.log(userId, userId, "USER",
                    "ROLE_REVOKED",
                    "Role '" + roleName + "' revoked from " + user.getEmail(),
                    true, roleName, null, null);
        });
    }

    @Override
    @Transactional
    public void deactivateUser(String id) {
        User user = findUserById(id);
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        auditLogService.log(id, id, "USER",
                "USER_DEACTIVATED", "User deactivated: " + user.getEmail(), true, null, null, null);
    }

    @Override
    @Transactional
    public void activateUser(String id) {
        User user = findUserById(id);
        user.setActive(true);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        auditLogService.log(id, id, "USER",
                "USER_ACTIVATED", "User activated: " + user.getEmail(), true, null, null, null);
    }

    @Override
    public List<String> getUserRoleNames(String userId) {
        return userRoleRepository.findByUserIdFlexible(userId).stream()
                .map(ur -> findRoleById(ur.getRoleId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(Role::getName)
                .distinct()
                .collect(Collectors.toList());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private User findUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private Optional<Role> findRoleById(String roleId) {
        if (roleId == null) return Optional.empty();
        Optional<Role> role = roleRepository.findById(roleId);
        if (role.isPresent()) return role;
        if (ObjectId.isValid(roleId)) {
            return roleRepository.findById(new ObjectId(roleId).toHexString());
        }
        return Optional.empty();
    }

    /** Lightweight JSON snapshot of mutable profile fields for the audit trail */
    private String toSnapshot(User u) {
        return "{\"firstName\":\"" + nullSafe(u.getFirstName()) + "\"" +
               ",\"lastName\":\""  + nullSafe(u.getLastName())  + "\"" +
               ",\"jobTitle\":\""  + nullSafe(u.getJobTitle())  + "\"" +
               ",\"bio\":\""       + nullSafe(u.getBio())       + "\"" +
               ",\"phoneNumber\":\"" + nullSafe(u.getPhoneNumber()) + "\"" +
               ",\"active\":"      + u.isActive() + "}";
    }

    private String nullSafe(String s) { return s == null ? "" : s.replace("\"", "\\\""); }

    private UserResponse mapToUserResponse(User user) {
        List<String> roles = user.getId() != null ? getUserRoleNames(user.getId()) : List.of();

        // Resolve flat permission list from all roles — used by frontend for UI guards
        List<String> permissions = user.getId() != null
            ? userRoleRepository.findByUserIdFlexible(user.getId()).stream()
                .map(ur -> roleRepository.findById(ur.getRoleId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .flatMap(role -> permissionRoleRepository.findByRoleId(role.getId()).stream())
                .map(PermissionRole::getPermissionId)
                .distinct()
                .map(permId -> permissionRepository.findById(permId))
                .filter(Optional::isPresent)
                .map(opt -> opt.get().getAction().toUpperCase())
                .distinct()
                .collect(Collectors.toList())
            : List.of();

        return UserResponse.builder()
                .id(user.getId())
                .roles(roles)
                .permissions(permissions)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .birthDate(user.getBirthDate())
                .phoneNumber(user.getPhoneNumber())
                .jobTitle(user.getJobTitle())
                .bio(user.getBio())
                .avatar(user.getAvatar())
                .isActive(user.isActive())
                .mustChangePassword(user.isMustChangePassword())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}