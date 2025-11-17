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

/**
 * JWT(JSON Web Token) 생성, 파싱, 검증을 담당하는 유틸리티 클래스입니다.
 */
@Component
public class JwtTokenUtil {

    /**
     * JWT의 유효 기간 (24시간, 밀리초 단위).
     */
    public static final long JWT_TOKEN_VALIDITY = 24 * 60 * 60 * 1000;

    /**
     * JWT 서명에 사용될 비밀 키.
     * 이 값은 {@code application.properties} 파일에서 주입받습니다.
     * 보안을 위해 복잡하고 긴 무작위 문자열을 사용해야 합니다.
     */
    @Value("${jwt.secret}")
    private String secret;

    /**
     * 비밀 키 문자열로부터 HMAC-SHA 알고리즘에 사용할 {@link Key} 객체를 생성합니다.
     * @return 서명에 사용될 키 객체.
     */
    private Key getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * JWT 토큰에서 사용자 이름(subject)을 추출합니다.
     * @param token 파싱할 JWT 토큰.
     * @return 토큰에 저장된 사용자 이름.
     */
    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    /**
     * JWT 토큰에서 만료 시간을 추출합니다.
     * @param token 파싱할 JWT 토큰.
     * @return 토큰의 만료 시간({@link Date} 객체).
     */
    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    /**
     * JWT 토큰에서 특정 클레임(claim)을 추출합니다.
     * @param token 파싱할 JWT 토큰.
     * @param claimsResolver 클레임에서 원하는 정보를 추출하는 함수.
     * @param <T> 추출할 정보의 타입.
     * @return 추출된 클레임 값.
     */
    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    /**
     * JWT 토큰의 모든 클레임을 담고 있는 본문(body)을 추출합니다.
     * 이 과정에서 토큰의 서명이 유효한지 검증됩니다.
     * @param token 파싱할 JWT 토큰.
     * @return 토큰의 모든 클레임을 담은 {@link Claims} 객체.
     */
    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token).getBody();
    }

    /**
     * 토큰이 만료되었는지 확인합니다.
     * @param token 검사할 JWT 토큰.
     * @return 만료되었으면 true, 그렇지 않으면 false.
     */
    private Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    /**
     * Spring Security의 {@link UserDetails} 객체를 기반으로 JWT 토큰을 생성합니다.
     * @param userDetails 토큰을 생성할 사용자의 정보.
     * @return 생성된 JWT 문자열.
     */
    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
                .signWith(getKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * 애플리케이션의 {@link User} 객체를 기반으로 JWT 토큰을 생성합니다.
     * 사용자 이름 외에 프로필 사진, 이메일 등 추가적인 정보를 커스텀 클레임으로 포함시킬 수 있습니다.
     * @param user 토큰을 생성할 사용자의 {@link User} 엔티티.
     * @return 생성된 JWT 문자열.
     */
    public String generateToken(User user) {
        Claims claims = Jwts.claims().setSubject(user.getUsername());
        claims.put("picture", user.getPicture());
        claims.put("email", user.getEmail());
        claims.put("provider", user.getProvider());

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + JWT_TOKEN_VALIDITY))
                .signWith(getKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * JWT 토큰에서 프로필 사진 URL 클레임을 추출합니다.
     * @param token 파싱할 JWT 토큰.
     * @return 토큰에 저장된 프로필 사진 URL.
     */
    public String getPictureFromToken(String token) {
        return getClaimFromToken(token, claims -> claims.get("picture", String.class));
    }

    /**
     * 토큰이 유효한지 검증합니다.
     * 토큰의 사용자 이름이 주어진 {@link UserDetails}의 사용자 이름과 일치하고,
     * 토큰이 만료되지 않았는지 확인합니다.
     * @param token 검증할 JWT 토큰.
     * @param userDetails 비교할 사용자의 정보.
     * @return 토큰이 유효하면 true, 그렇지 않으면 false.
     */
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}