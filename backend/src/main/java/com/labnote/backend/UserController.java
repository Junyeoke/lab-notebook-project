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

/**
 * 사용자 관련 정보 조회 및 수정을 처리하는 컨트롤러입니다.
 * {@code /api/user} 경로의 요청을 담당합니다.
 */
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

    /**
     * 현재 인증된 사용자의 프로필 정보를 업데이트합니다.
     * 사용자 이름, 이메일, 프로필 사진을 변경할 수 있습니다.
     * 변경 사항이 있을 경우 새로운 JWT 토큰을 발급하여 반환합니다.
     *
     * @param newUsername 새로운 사용자 이름 (선택 사항).
     * @param newEmail 새로운 이메일 주소 (선택 사항).
     * @param pictureFile 새로운 프로필 사진 파일 (선택 사항).
     * @return 업데이트된 사용자 정보를 포함하는 새로운 JWT 토큰 또는 에러 메시지.
     */
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

        if (newUsername != null && !newUsername.trim().isEmpty() && !newUsername.equals(currentUsername)) {
            if (userRepository.existsByUsername(newUsername)) {
                return ResponseEntity.badRequest().body(Map.of("message", "이미 존재하는 사용자 이름입니다."));
            }
            user.setUsername(newUsername.trim());
        }

        if (newEmail != null && !newEmail.trim().isEmpty() && !newEmail.equals(user.getEmail())) {
            if (userRepository.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest().body(Map.of("message", "이미 사용중인 이메일입니다."));
            }
            user.setEmail(newEmail.trim());
        }

        if (pictureFile != null && !pictureFile.isEmpty()) {
            String picturePath = fileStorageService.storeProfilePicture(pictureFile);
            user.setPicture(picturePath);
        }

        userRepository.save(user);

        final String token = jwtTokenUtil.generateToken(user);

        return ResponseEntity.ok(Map.of("token", token));
    }

    /**
     * 현재 인증된 사용자 계정을 삭제합니다.
     * 이 사용자가 소유한 모든 실험 노트 항목({@link Entry})도 함께 삭제됩니다.
     * {@code @Transactional} 어노테이션을 통해 모든 작업이 하나의 트랜잭션으로 묶여 원자성을 보장합니다.
     *
     * @return 회원 탈퇴 성공 메시지.
     */
    @DeleteMapping("/me")
    @Transactional
    public ResponseEntity<?> deleteUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 이 사용자가 작성한 모든 Entry를 먼저 삭제합니다.
        // User 엔티티의 @PreRemove 메소드에서 sharedProjects 관계를 정리합니다.
        entryRepository.deleteAllByUser(user);

        // User 엔티티 삭제 시, cascade 설정에 따라 Projects 및 Templates도 함께 삭제됩니다.
        userRepository.delete(user);

        return ResponseEntity.ok(Map.of("message", "회원 탈퇴가 완료되었습니다."));
    }
}

/**
 * 사용자 정보 업데이트 요청 시 사용될 DTO (현재는 @RequestParam으로 대체되어 사용되지 않음).
 * (만약 JSON 본문으로 업데이트 요청을 받는다면 이 클래스를 사용할 수 있습니다.)
 */
class UserUpdateRequest {
    public String username;
    public String email;
    public String picture;
}
