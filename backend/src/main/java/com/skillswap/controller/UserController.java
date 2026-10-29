package com.skillswap.controller;

import com.skillswap.dto.CommonDtos;
import com.skillswap.entity.User;
import com.skillswap.enums.AccountStatus;
import com.skillswap.security.SecurityUtils;
import com.skillswap.service.UserService;
import com.skillswap.util.UploadContentValidator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private static final long MAX_PROFILE_PHOTO_BYTES = 5L * 1024 * 1024;

    private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );

    private final UserService userService;

    @Value("${app.upload.directory:uploads}")
    private String uploadBaseDir;

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser() {
        String email = getAuthenticatedEmail();
        return ResponseEntity.ok(userService.getUserByEmail(email));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAll() {
        // ✅ Typed return instead of Object
        return ResponseEntity.ok(userService.getAll());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateStatus(@PathVariable Long id,
                                             @Valid @RequestBody CommonDtos.StatusUpdateRequest request) {
        return ResponseEntity.ok(userService.updateAccountStatus(id,
                AccountStatus.valueOf(request.getStatus().trim().toUpperCase())));
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<User> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody CommonDtos.ProfileUpdateRequest request) {
        // ✅ Only the profile owner (or an admin) may update it
        User currentUser = userService.getUserByEmail(getAuthenticatedEmail());
        if (!currentUser.getId().equals(id) && !SecurityUtils.isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own profile");
        }
        return ResponseEntity.ok(userService.updateProfile(id, request));
    }

    @PutMapping("/me/profile")
    public ResponseEntity<User> updateMyProfile(
            @Valid @RequestBody CommonDtos.ProfileUpdateRequest request) {
        String email = getAuthenticatedEmail();
        User user = userService.getUserByEmail(email);
        return ResponseEntity.ok(userService.updateProfile(user.getId(), request));
    }

    @PostMapping("/me/profile-photo")
    public ResponseEntity<?> uploadProfilePhoto(@RequestParam("file") MultipartFile file) {
        // ✅ Handled with try-catch instead of throws IOException
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("No file uploaded");
        }

        String contentType = UploadContentValidator.normalizeMediaType(file.getContentType());
        String extension = ALLOWED_IMAGE_TYPES.get(contentType);
        if (extension == null || file.getSize() > MAX_PROFILE_PHOTO_BYTES) {
            return ResponseEntity.badRequest().body("Only JPEG, PNG, and WebP images are allowed");
        }

        try {
            byte[] content = file.getBytes();
            if (!UploadContentValidator.isSupportedImage(contentType, content)) {
                return ResponseEntity.badRequest().body("The uploaded file does not match its image type");
            }
            // ✅ Use absolute path based on configured upload directory
            String uploadDir = uploadBaseDir + File.separator + "profile-photos" + File.separator;
            Path uploadDirPath = Paths.get(uploadDir).toAbsolutePath();
            File dir = uploadDirPath.toFile();
            
            if (!dir.exists()) {
                if (!dir.mkdirs()) {
                    return ResponseEntity.internalServerError()
                            .body("Failed to create upload directory");
                }
            }

            String filename = UUID.randomUUID() + "." + extension;
            Path filepath = uploadDirPath.resolve(filename).normalize();
            if (!filepath.startsWith(uploadDirPath)) {
                throw new IOException("Invalid upload path");
            }

            // ✅ REPLACE_EXISTING prevents FileAlreadyExistsException
            Files.write(filepath, content);

            String url = "/uploads/profile-photos/" + filename;

            String email = getAuthenticatedEmail();
            User user = userService.getUserByEmail(email);
            user.setProfilePhotoUrl(url);
            userService.save(user);
            log.info("Profile photo uploaded for userId={}", user.getId());

            return ResponseEntity.ok(url);

        } catch (IOException e) {
            log.error("Profile photo upload failed", e);
            return ResponseEntity.internalServerError().body("File upload failed");
        }
    }

    // ✅ Extracted helper to avoid repeating SecurityContext logic
    private String getAuthenticatedEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }
}
