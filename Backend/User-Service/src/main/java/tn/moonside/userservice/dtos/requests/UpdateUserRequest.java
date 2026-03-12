package tn.moonside.userservice.dtos.requests;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserRequest {

    private String firstName;

    private String lastName;

    private LocalDate birthDate;

    private String phoneNumber;

    private String jobTitle;

    private String bio;

    private String avatar;
}