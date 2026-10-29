package com.skillswap.service;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.User;
import com.skillswap.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class UserServiceTest {

    @Test
    void profileUpdateTrimsValuesAndClearsBlankOptionalFields() {
        UserRepository users = mock(UserRepository.class);
        User user = User.builder().fullName("Before").bio("old bio").city("Old City").build();
        when(users.findById(7L)).thenReturn(Optional.of(user));
        when(users.save(user)).thenReturn(user);
        CommonDtos.ProfileUpdateRequest request = new CommonDtos.ProfileUpdateRequest();
        request.setFullName("  New Name  ");
        request.setBio("  New bio  ");
        request.setCity("  ");

        User updated = new UserService(users).updateProfile(7L, request);

        assertThat(updated.getFullName()).isEqualTo("New Name");
        assertThat(updated.getBio()).isEqualTo("New bio");
        assertThat(updated.getCity()).isNull();
        verify(users).save(user);
    }

    @Test
    void profileUpdateRejectsBlankFullName() {
        UserRepository users = mock(UserRepository.class);
        when(users.findById(7L)).thenReturn(Optional.of(User.builder().fullName("Current").build()));
        CommonDtos.ProfileUpdateRequest request = new CommonDtos.ProfileUpdateRequest();
        request.setFullName("   ");

        assertThatThrownBy(() -> new UserService(users).updateProfile(7L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Full name cannot be blank");
        verify(users, never()).save(any());
    }
}
