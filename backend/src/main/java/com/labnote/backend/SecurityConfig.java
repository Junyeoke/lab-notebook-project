package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// [ 1. 추가 ] 람다식 설정을 위한 import
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    // 1. 비밀번호 암호화(해싱)를 위한 Bean (동일)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. AuthenticationManager Bean (로그인 시 사용) (동일)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // (삭제된 'configureGlobal' 메소드 - 잘 하셨습니다)

    // 4. HTTP 보안 설정 (람다식으로 수정)
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // [ 2. 수정 ] .cors().and() -> .cors(Customizer.withDefaults())
                // (WebConfig.java에 정의한 글로벌 CORS 설정을 기본값으로 사용)
                .cors(Customizer.withDefaults())

                // [ 3. 수정 ] .csrf().disable() -> .csrf(AbstractHttpConfigurer::disable)
                // (람다식을 사용한 CSRF 비활성화)
                .csrf(AbstractHttpConfigurer::disable)

                // (authorizeHttpRequests 이하는 이미 람다식이므로 OK)
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )

                // (sessionManagement도 람다식이므로 OK)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // (필터 추가는 OK)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}