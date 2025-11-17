package com.labnote.backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

/**
 * Spring Security 설정을 담당하는 클래스입니다.
 * 웹 애플리케이션의 보안 규칙, 인증/인가 메커니즘을 정의합니다.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    /**
     * 필요한 보안 관련 컴포넌트들을 주입받는 생성자입니다.
     * @param jwtAuthenticationFilter      JWT 인증을 처리하는 커스텀 필터.
     * @param customOAuth2UserService      OAuth2 로그인 시 사용자 정보를 처리하는 커스텀 서비스.
     * @param oAuth2AuthenticationSuccessHandler OAuth2 로그인 성공 후 로직을 처리하는 핸들러.
     */
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, CustomOAuth2UserService customOAuth2UserService, OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.customOAuth2UserService = customOAuth2UserService;
        this.oAuth2AuthenticationSuccessHandler = oAuth2AuthenticationSuccessHandler;
    }

    /**
     * Spring Security의 인증을 관리하는 {@link AuthenticationManager}를 빈으로 등록합니다.
     * 이는 사용자 이름/비밀번호 인증 시 사용됩니다.
     * @param authenticationConfiguration Spring Security의 인증 설정 객체.
     * @return {@link AuthenticationManager} 인스턴스.
     * @throws Exception 설정 과정에서 발생할 수 있는 예외.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    /**
     * HTTP 요청에 대한 보안 규칙을 정의하는 {@link SecurityFilterChain}을 빈으로 등록합니다.
     * @param http {@link HttpSecurity} 객체.
     * @return 구성된 {@link SecurityFilterChain}.
     * @throws Exception 설정 과정에서 발생할 수 있는 예외.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. CORS(Cross-Origin Resource Sharing) 설정을 기본값으로 활성화합니다.
                // (WebConfig에서 더 상세한 설정을 관리합니다)
                .cors(Customizer.withDefaults())

                // 2. CSRF(Cross-Site Request Forgery) 보호를 비활성화합니다.
                // JWT 기반의 stateless 인증을 사용하므로 CSRF 토큰이 필요 없습니다.
                .csrf(AbstractHttpConfigurer::disable)

                // 3. HTTP 요청에 대한 인가(Authorization) 규칙을 설정합니다.
                .authorizeHttpRequests(authz -> authz
                        // '/api/auth/**', '/oauth2/**' 경로는 인증 없이 누구나 접근 허용합니다. (로그인, 회원가입 등)
                        .requestMatchers("/api/auth/**", "/oauth2/**").permitAll()
                        // '/uploads/**' 경로도 누구나 접근 허용합니다. (이미지 파일 등)
                        .requestMatchers("/uploads/**").permitAll()
                        // '/api/**' 로 시작하는 모든 경로는 인증된 사용자만 접근 가능합니다.
                        .requestMatchers("/api/**").authenticated()
                        // 그 외 나머지 모든 요청은 일단 허용합니다.
                        .anyRequest().permitAll()
                )

                // 4. 세션 관리 정책을 설정합니다.
                // API 서버는 상태를 유지하지 않는(stateless) 방식으로 동작해야 하므로 세션을 생성하지 않습니다.
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 5. OAuth2 로그인 설정을 구성합니다.
                .oauth2Login(oauth2 -> oauth2
                        // 사용자 정보를 가져오는 엔드포인트에 대한 설정을 합니다.
                        .userInfoEndpoint(userInfo -> userInfo
                                // 기본 서비스 대신 우리가 만든 CustomOAuth2UserService를 사용합니다.
                                .userService(customOAuth2UserService)
                        )
                        // OAuth2 인증 성공 시, 우리가 만든 OAuth2AuthenticationSuccessHandler를 사용합니다.
                        .successHandler(oAuth2AuthenticationSuccessHandler)
                )

                // 6. 우리가 만든 JwtAuthenticationFilter를 UsernamePasswordAuthenticationFilter 앞에 추가합니다.
                // 이를 통해 모든 인증 요청보다 먼저 JWT 검증이 이루어집니다.
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}