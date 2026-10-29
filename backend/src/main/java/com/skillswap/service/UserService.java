package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.User;
import com.skillswap.enums.AccountStatus;
import com.skillswap.exception.ResourceNotFoundException;
import com.skillswap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public User updateProfile(Long id, CommonDtos.ProfileUpdateRequest request) {
        User user = getById(id);

        if (request.getFullName() != null) {
            if (request.getFullName().isBlank()) throw new IllegalArgumentException("Full name cannot be blank");
            user.setFullName(request.getFullName().trim());
        }
        if (request.getBio() != null) user.setBio(normalizeOptionalText(request.getBio()));
        if (request.getCity() != null) user.setCity(normalizeOptionalText(request.getCity()));
        if (request.getCountry() != null) user.setCountry(normalizeOptionalText(request.getCountry()));
        if (request.getLanguages() != null) user.setLanguages(normalizeOptionalText(request.getLanguages()));
        if (request.getAvailabilityText() != null) user.setAvailabilityText(normalizeOptionalText(request.getAvailabilityText()));

        return userRepository.save(user);
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = getById(id);
        userRepository.delete(user);
    }

    @Transactional
    public User updateAccountStatus(Long id, AccountStatus status) {
        User user = getById(id);
        user.setAccountStatus(status);
        return userRepository.save(user);
    }

    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    private String normalizeOptionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
