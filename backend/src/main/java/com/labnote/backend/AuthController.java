package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 인증 관련 요청(로그인, 회원가입 등)을 처리하는 컨트롤러입니다.
 * {@code /api/auth} 경로의 요청을 담당합니다.
 */
@RestController
@RequestMapping("/api/auth")
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

    /**
     * 사용자 이름(ID)의 중복 여부를 확인하는 API입니다.
     * 클라이언트에서 실시간으로 사용자 이름 사용 가능 여부를 확인할 수 있도록 지원합니다.
     *
     * @param username 중복 확인할 사용자 이름. 쿼리 파라미터로 전달됩니다.
     * @return 사용 가능 여부를 담은 JSON 객체. e.g., {@code {"available": true}}
     */
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam("username") String username) {
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of("available", false));
        }
        boolean isAvailable = !userRepository.existsByUsername(username.trim());
        return ResponseEntity.ok(Map.of("available", isAvailable));
    }

    /**
     * 신규 사용자 회원가입을 처리하는 API입니다.
     * 요청 본문으로 받은 사용자 정보(username, password, email)를 검증하고 데이터베이스에 저장합니다.
     *
     * @param authRequest 회원가입에 필요한 사용자 정보를 담은 DTO.
     * @return 회원가입 성공 또는 실패 메시지를 담은 JSON 객체.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody AuthRequest authRequest) {
        if (userRepository.existsByUsername(authRequest.username)) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "이미 존재하는 사용자 이름입니다."));
        }

        if (authRequest.email == null || authRequest.email.trim().isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "이메일은 필수 항목입니다."));
        }

        if (userRepository.existsByEmail(authRequest.email)) {
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("message", "이미 사용중인 이메일입니다."));
        }

        User user = new User();
        user.setUsername(authRequest.username);
        user.setEmail(authRequest.email);
        user.setPassword(passwordEncoder.encode(authRequest.password));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "회원가입이 완료되었습니다."));
    }

    /**
     * 사용자 로그인을 처리하고 인증에 성공하면 JWT 토큰을 발급하는 API입니다.
     *
     * @param authRequest 로그인에 필요한 사용자 이름과 비밀번호를 담은 DTO.
     * @return 인증 성공 시 JWT 토큰, 실패 시 에러 메시지를 담은 JSON 객체.
     * @throws Exception 인증 과정에서 발생할 수 있는 예외.
     */
    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authRequest) throws Exception {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(authRequest.username, authRequest.password)
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("message", "아이디 또는 비밀번호가 잘못되었습니다."));
        }

        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username);
        final String token = jwtTokenUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token));
    }
}