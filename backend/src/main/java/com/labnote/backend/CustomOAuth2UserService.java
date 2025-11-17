package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * OAuth2 로그인 성공 후 사용자 정보를 처리하는 서비스 클래스입니다.
 * Spring Security의 {@link DefaultOAuth2UserService}를 상속받아 기능을 확장합니다.
 */
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * OAuth2 제공자로부터 사용자 정보를 받아온 후, 애플리케이션의 데이터베이스와 동기화합니다.
     * 제공받은 이메일(username으로 사용)을 기준으로 기존 사용자인지 확인합니다.
     * - 기존 사용자: 이름, 프로필 사진, 제공자 정보를 최신으로 업데이트합니다.
     * - 신규 사용자: 새로운 사용자 계정을 생성하고 데이터베이스에 저장합니다. OAuth2 사용자는 직접적인 비밀번호 로그인을
     *   하지 않으므로, 임의의 UUID를 암호화하여 비밀번호 필드에 저장합니다.
     *
     * @param userRequest OAuth2 제공자로부터 받은 사용자 정보 요청 객체.
     * @return 처리된 {@link OAuth2User} 객체.
     * @throws OAuth2AuthenticationException 인증 과정에서 오류 발생 시.
     */
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name"); // 'name' is available but not used in the current logic
        String picture = oAuth2User.getAttribute("picture");

        // 이메일을 username으로 사용하여 사용자를 찾습니다.
        Optional<User> userOptional = userRepository.findByUsername(email);
        User user;
        if (userOptional.isPresent()) {
            // 이미 존재하는 사용자인 경우, 정보를 업데이트합니다.
            user = userOptional.get();
            user.setEmail(email);
            user.setPicture(picture);
            user.setProvider(provider);
        } else {
            // 신규 사용자인 경우, 새로운 User 객체를 생성합니다.
            user = new User();
            user.setUsername(email); // 일관성을 위해 username을 이메일로 설정
            user.setEmail(email);
            user.setPicture(picture);
            user.setProvider(provider);
            // OAuth2 사용자를 위한 임의의 사용 불가능한 비밀번호를 생성하여 저장합니다.
            user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        }
        userRepository.save(user);

        return oAuth2User;
    }
}
