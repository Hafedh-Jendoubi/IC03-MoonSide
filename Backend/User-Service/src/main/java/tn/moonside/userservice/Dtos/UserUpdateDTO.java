package tn.moonside.user.Dtos;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateDTO {
    private String email;
    private String firstname;
    private String lastname;
    private LocalDateTime birthDate;
    private String phoneNumber;
    private String jobTitle;
    private String bio;
    private String avatar;
    private Set<UUID> roleIds;
}