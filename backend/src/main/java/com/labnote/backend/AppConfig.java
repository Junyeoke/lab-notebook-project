package com.labnote.backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 애플리케이션의 전반적인 구성을 담당하는 클래스입니다.
 * Spring의 @Configuration 어노테이션을 사용하여 이 클래스가 구성 정보를 포함하고 있음을 나타냅니다.
 * 애플리케이션에 필요한 다양한 빈(Bean)을 등록하고 설정하는 역할을 합니다.
 */
@Configuration
public class AppConfig {

    /**
     * 비밀번호 암호화를 위한 PasswordEncoder 빈을 생성합니다.
     * BCryptPasswordEncoder를 사용하여 사용자의 비밀번호를 안전하게 해싱합니다.
     * 이 빈은 애플리케이션 전역에서 주입받아 사용할 수 있습니다.
     *
     * @return PasswordEncoder 인터페이스의 구현체인 BCryptPasswordEncoder 객체를 반환합니다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
