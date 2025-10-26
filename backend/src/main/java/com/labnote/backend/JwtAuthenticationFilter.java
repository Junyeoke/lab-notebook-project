package com.labnote.backend;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // 1. HTTP 헤더에서 'Authorization' 값을 찾음
        final String requestTokenHeader = request.getHeader("Authorization");

        String username = null;
        String jwtToken = null;

        // 2. 헤더가 존재하고 'Bearer '로 시작하는지 확인
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7); // "Bearer " 이후의 토큰 값
            try {
                username = jwtTokenUtil.getUsernameFromToken(jwtToken);
            } catch (IllegalArgumentException e) {
                logger.warn("JWT 토큰을 가져올 수 없습니다.");
            } catch (ExpiredJwtException e) {
                logger.warn("JWT 토큰이 만료되었습니다.");
            }
        } else {
            // logger.warn("JWT 토큰이 'Bearer '로 시작하지 않습니다.");
        }

        // 3. 토큰을 성공적으로 가져왔고, 아직 SecurityContext에 인증 정보가 없는 경우
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 4. DB에서 사용자 정보 로드
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // 5. 토큰이 유효한지 검증
            if (jwtTokenUtil.validateToken(jwtToken, userDetails)) {

                // 6. Spring Security가 관리하는 인증 토큰 생성
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 7. SecurityContextHolder에 인증 정보 설정 (이 요청은 인증된 것으로 간주)
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        }

        // 8. 다음 필터로 요청/응답 전달
        chain.doFilter(request, response);
    }
}