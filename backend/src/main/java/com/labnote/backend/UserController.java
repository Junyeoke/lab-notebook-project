package com.labnote.backend;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

class UserUpdateRequest {
    public String username;
}

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntryRepository entryRepository;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private FileStorageService fileStorageService;

    @PutMapping(value = "/me", consumes = {"multipart/form-data"})
    public ResponseEntity<?> updateUser(
            @RequestParam(value = "username", required = false) String newUsername,
            @RequestParam(value = "email", required = false) String newEmail,
            @RequestParam(value = "picture", required = false) MultipartFile pictureFile
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update username
        if (newUsername != null && !newUsername.trim().isEmpty() && !newUsername.equals(currentUsername)) {
            if (userRepository.existsByUsername(newUsername)) {
                return ResponseEntity.badRequest().body(Map.of("message", "이미 존재하는 사용자 이름입니다."));
            }
            user.setUsername(newUsername.trim());
        }

        // Update email
        if (newEmail != null && !newEmail.trim().isEmpty() && !newEmail.equals(user.getEmail())) {
            if (userRepository.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest().body(Map.of("message", "이미 사용중인 이메일입니다."));
            }
            user.setEmail(newEmail.trim());
        }

        // Update profile picture
        if (pictureFile != null && !pictureFile.isEmpty()) {
            String picturePath = fileStorageService.storeProfilePicture(pictureFile);
            // Store the full URL or the relative path? Let's store the relative path.
            // The frontend will prepend the base URL.
            user.setPicture(picturePath);
        }

        userRepository.save(user);

        // Generate a new token with the updated details
        final String token = jwtTokenUtil.generateToken(user);

        return ResponseEntity.ok(Map.of("token", token));
    }

    @DeleteMapping("/me")
    @Transactional
    public ResponseEntity<?> deleteUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Explicitly delete all entries for this user first
        entryRepository.deleteAllByUser(user);

        // Now, deleting the user will cascade to Projects and Templates
        userRepository.delete(user);

        return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다."));
    }
}
