package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map; // Map.of()를 사용하기 위한 import

/**
 * 로그인/회원가입 요청을 위한 간단한 DTO (Data Transfer Object) 클래스
 * (별도 파일로 분리해도 됩니다)
 */
class AuthRequest {
    public String username;
    public String password;
}

/**
 * 로그인 성공 시 JWT 토큰을 반환하기 위한 DTO 클래스
 */
class AuthResponse {
    public String token;
    public AuthResponse(String token) { this.token = token; }
}

@RestController
@RequestMapping("/api/auth")
// @CrossOrigin은 WebConfig.java에서 전역 설정했으므로 주석 처리 (또는 삭제)
public class AuthController {

    // 필요한 빈(Bean)들 주입
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * [신규] 아이디 중복 체크 API (GET /api/auth/check-username)
     * @param username 쿼리 파라미터로 받을 아이디
     * @return {"available": true/false} 형태의 JSON 응답
     */
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam("username") String username) {
        // 아이디가 비어있거나 공백이면 사용 불가
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of("available", false));
        }

        // userRepository.existsByUsername()을 호출
        // DB에 존재하면(true) -> 사용 불가(false)
        // DB에 존재하지 않으면(false) -> 사용 가능(true)
        boolean isAvailable = !userRepository.existsByUsername(username.trim());

        return ResponseEntity.ok(Map.of("available", isAvailable));
    }

    /**
     * 회원가입 API (POST /api/auth/register)
     * @param authRequest username, password가 담긴 JSON 요청 본문
     * @return 성공 또는 실패 메시지
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest authRequest) {
        // [수정] existsByUsername으로 더 효율적인 중복 체크
        if (userRepository.existsByUsername(authRequest.username)) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "이미 존재하는 사용자 이름입니다."));
        }

        // 새 User 객체 생성
        com.labnote.backend.User user = new com.labnote.backend.User();
        user.setUsername(authRequest.username);
        // [중요] 비밀번호는 반드시 BCrypt 등으로 해시(암호화)하여 저장
        user.setPassword(passwordEncoder.encode(authRequest.password));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "회원가입이 완료되었습니다."));
    }

    /**
     * 로그인 API (POST /api/auth/login)
     * @param authRequest username, password가 담긴 JSON 요청 본문
     * @return 성공 시 JWT 토큰, 실패 시 에러 메시지
     */
    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authRequest) throws Exception {

        // 1. Spring Security의 AuthenticationManager로 사용자 인증 시도
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.username, authRequest.password)
            );
        } catch (BadCredentialsException e) {
            // 2. 인증 실패 (아이디 또는 비밀번호 틀림)
            return ResponseEntity
                    .status(401) // 401 Unauthorized
                    .body(Map.of("message", "아이디 또는 비밀번호가 잘못되었습니다."));
        }

        // 3. 인증 성공
        // 4. UserDetailsServiceImpl을 통해 DB에서 사용자 정보 로드
        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username);

        // 5. JwtTokenUtil을 사용해 JWT 토큰 생성
        final String token = jwtTokenUtil.generateToken(userDetails);

        // 6. 생성된 토큰을 AuthResponse DTO에 담아 반환
        return ResponseEntity.ok(new AuthResponse(token));
    }
}