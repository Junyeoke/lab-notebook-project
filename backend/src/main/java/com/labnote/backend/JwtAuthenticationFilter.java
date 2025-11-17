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

/**
 * 들어오는 모든 HTTP 요청을 가로채 JWT(JSON Web Token)를 검사하는 필터입니다.
 * {@link OncePerRequestFilter}를 상속하여 요청당 한 번만 실행되도록 보장합니다.
 * 이 필터는 Spring Security 설정에서 UsernamePasswordAuthenticationFilter 앞에 위치해야 합니다.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    /**
     * 실제 필터링 로직을 수행하는 메소드입니다.
     * 요청 헤더에서 JWT를 추출하고, 유효성을 검증한 후, 유효한 경우 해당 사용자를
     * Spring Security의 SecurityContextHolder에 인증된 사용자로 등록합니다.
     *
     * @param request  HTTP 요청 객체.
     * @param response HTTP 응답 객체.
     * @param chain    필터 체인.
     * @throws ServletException 서블릿 처리 중 예외 발생 시.
     * @throws IOException      입출력 예외 발생 시.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // 1. HTTP 요청 헤더에서 'Authorization' 값을 가져옵니다.
        final String requestTokenHeader = request.getHeader("Authorization");

        String username = null;
        String jwtToken = null;

        // 2. 헤더가 존재하고 "Bearer "로 시작하는지 확인합니다.
        if (requestTokenHeader != null && requestTokenHeader.startsWith("Bearer ")) {
            jwtToken = requestTokenHeader.substring(7); // "Bearer " 접두사를 제외한 토큰 부분만 추출합니다.
            try {
                // 3. 토큰에서 사용자 이름(username)을 추출합니다.
                username = jwtTokenUtil.getUsernameFromToken(jwtToken);
            } catch (IllegalArgumentException e) {
                logger.warn("JWT 토큰을 가져올 수 없습니다.");
            } catch (ExpiredJwtException e) {
                logger.warn("JWT 토큰이 만료되었습니다.");
            }
        } else {
            // "Bearer " 토큰이 없는 다른 요청들을 위해 경고 로그는 주석 처리할 수 있습니다.
            // logger.warn("JWT 토큰이 'Bearer '로 시작하지 않습니다.");
        }

        // 4. 토큰에서 사용자 이름을 성공적으로 추출했고, 현재 SecurityContext에 인증 정보가 없는 경우에만 처리합니다.
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 5. 데이터베이스에서 사용자 정보를 로드합니다.
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // 6. 토큰의 유효성을 검증합니다 (사용자 정보, 서명, 만료 시간 등).
            if (jwtTokenUtil.validateToken(jwtToken, userDetails)) {

                // 7. 유효한 토큰인 경우, Spring Security가 사용할 인증 토큰을 생성합니다.
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 8. SecurityContextHolder에 인증 정보를 설정합니다.
                // 이 설정 이후부터 해당 요청은 인증된 사용자의 요청으로 간주됩니다.
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
        }

        // 9. 다음 필터로 요청과 응답을 전달하여 체인을 계속 진행합니다.
        chain.doFilter(request, response);
    }
}