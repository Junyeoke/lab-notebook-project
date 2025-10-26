package com.labnote.backend;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtTokenUtil {

    // 1. JWT 만료 시간 (예: 24시간)
    public static final long JWT_TOKEN_VALIDITY = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

    // 2. JWT 비밀 키 (application.properties에 저장해야 함)
    //    (매우 강력하고 긴 무작위 문자열 사용!)
    @Value("${jwt.secret}")
    private String secret;

    private Key getKey() {
        // HMAC-SHA 알고리즘을 위한 키 생성
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // 3. 토큰에서 사용자 이름(username) 추출
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    // 4. 토큰에서 만료 시간 추출
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    // 5. 토큰의 Claim(정보) 추출
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    // 6. 모든 Claim 추출
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token).getBody();
    }

    // 7. 토큰 만료 여부 확인
    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    // 8. UserDetails를 기반으로 JWT 토큰 생성
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername()) // 토큰 제목 (사용자 이름)
                .setIssuedAt(new Date(System.currentTimeMillis())) // 발급 시간
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY)) // 만료 시간
                .signWith(getKey(), SignatureAlgorithm.HS512) // 서명 (알고리즘 + 키)
                .compact();
    }

    // 9. 토큰 유효성 검사 (사용자 이름이 같고, 만료되지 않았는지)
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}