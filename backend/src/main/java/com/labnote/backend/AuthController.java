package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map; // 간단한 JSON 응답을 위해

// (DTO를 위한 내부 클래스 정의)
class AuthRequest {
    public String username;
    public String password;
}

class AuthResponse {
    public String token;
    public AuthResponse(String token) { this.token = token; }
}

@RestController
@RequestMapping("/api/auth")
// @CrossOrigin("http://localhost:3000") // (WebConfig에서 전역 설정했으므로 불필요)
public class AuthController {

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

    // 1. (C) 회원가입
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest authRequest) {
        // 이미 존재하는 사용자인지 확인
        if (userRepository.findByUsername(authRequest.username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "이미 존재하는 사용자 이름입니다."));
        }

        // 새 User 객체 생성
        com.labnote.backend.User user = new com.labnote.backend.User();
        user.setUsername(authRequest.username);
        // [중요] 비밀번호를 반드시 해시하여 저장
        user.setPassword(passwordEncoder.encode(authRequest.password));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "회원가입이 완료되었습니다."));
    }

    // 2. (R) 로그인
    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authRequest) throws Exception {

        // 1. Spring Security를 사용해 ID/PW 인증 시도
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.username, authRequest.password)
            );
        } catch (BadCredentialsException e) {
            // 2. 인증 실패
            return ResponseEntity.status(401).body(Map.of("message", "아이디 또는 비밀번호가 잘못되었습니다."));
        }

        // 3. 인증 성공
        // 4. DB에서 UserDetails 로드
        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username);

        // 5. JWT 토큰 생성
        final String token = jwtTokenUtil.generateToken(userDetails);

        // 6. 토큰을 JSON으로 반환
        return ResponseEntity.ok(new AuthResponse(token));
    }
}