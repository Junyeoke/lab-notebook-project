package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

/**
 * Spring Security의 {@link UserDetailsService} 인터페이스를 구현하여
 * 사용자 인증 시 데이터베이스에서 사용자 정보를 로드하는 서비스입니다.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    /**
     * 주어진 사용자 이름(username)을 기반으로 사용자 상세 정보를 로드합니다.
     * 이 메소드는 Spring Security 인증 과정에서 호출됩니다.
     *
     * @param username 로드할 사용자의 이름.
     * @return Spring Security가 사용하는 {@link UserDetails} 객체.
     * @throws UsernameNotFoundException 해당 사용자 이름으로 사용자를 찾을 수 없을 경우 발생.
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 데이터베이스에서 사용자 이름으로 User 엔티티를 조회합니다.
        com.labnote.backend.User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));

        // 조회된 User 엔티티 정보를 Spring Security의 UserDetails 객체로 변환하여 반환합니다.
        // 현재는 권한(authorities)이 없으므로 빈 ArrayList를 전달합니다.
        return new User(user.getUsername(), user.getPassword(), new ArrayList<>());
    }
}