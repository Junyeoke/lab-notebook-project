package com.labnote.backend;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.UUID;

/**
 * OAuth2 인증 성공 후의 로직을 처리하는 핸들러입니다.
 * 인증된 사용자 정보를 기반으로 JWT를 생성하고, 프론트엔드 애플리케이션으로 리디렉션하는 역할을 합니다.
 */
@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenUtil jwtTokenUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 필요한 의존성을 주입받는 생성자입니다.
     * @param jwtTokenUtil JWT 생성 및 관리를 위한 유틸리티.
     * @param userRepository 사용자 정보 조회를 위한 리포지토리.
     * @param passwordEncoder 비밀번호 암호화를 위한 인코더.
     */
    @Autowired
    public OAuth2AuthenticationSuccessHandler(JwtTokenUtil jwtTokenUtil, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.jwtTokenUtil = jwtTokenUtil;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * OAuth2 인증이 성공적으로 완료되었을 때 호출되는 메소드입니다.
     * 1. OAuth2 사용자 정보에서 이메일을 추출합니다.
     * 2. 데이터베이스에서 해당 이메일의 사용자를 조회합니다.
     *    - 참고: {@link CustomOAuth2UserService}에서 이미 사용자 생성/업데이트를 처리하므로,
     *      여기서는 대부분의 경우 사용자를 찾게 됩니다. `orElseGet` 부분은 예외적인 경우를 위한 안전장치입니다.
     * 3. 해당 사용자를 위한 JWT를 생성합니다.
     * 4. 생성된 JWT를 쿼리 파라미터로 포함하여 프론트엔드의 특정 경로로 리디렉션합니다.
     *
     * @param request  HTTP 요청 객체.
     * @param response HTTP 응답 객체.
     * @param authentication Spring Security에 의해 생성된 인증 객체.
     * @throws IOException 리디렉션 중 오류 발생 시.
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        // CustomOAuth2UserService에서 이미 사용자 처리가 되었으므로, 여기서는 사용자를 찾기만 하면 됩니다.
        User user = userRepository.findByUsername(email)
                .orElseThrow(() -> new IllegalStateException("OAuth2 인증 후 사용자를 찾을 수 없습니다. CustomOAuth2UserService 로직을 확인하세요."));

        // 해당 사용자를 위한 JWT 생성
        String token = jwtTokenUtil.generateToken(user);

        // 프론트엔드의 리디렉션 핸들러 URL에 토큰을 담아 보냅니다.
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:3000/oauth2/redirect")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
