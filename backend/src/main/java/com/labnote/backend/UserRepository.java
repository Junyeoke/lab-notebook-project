package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * {@link User} 엔티티에 대한 데이터베이스 연산을 처리하는 Spring Data JPA 리포지토리입니다.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 주어진 사용자 이름(username)으로 사용자를 조회합니다.
     * 로그인 및 인증 과정에서 주로 사용됩니다.
     * @param username 조회할 사용자의 이름.
     * @return 조회된 {@link User} 객체를 담은 Optional. 사용자가 없으면 Optional.empty()를 반환.
     */
    Optional<User> findByUsername(String username);

    /**
     * 주어진 사용자 이름(username)을 가진 사용자가 존재하는지 여부를 확인합니다.
     * 회원가입 시 사용자 이름 중복 확인 등에 사용됩니다.
     * @param username 확인할 사용자 이름.
     * @return 해당 사용자 이름의 사용자가 존재하면 true, 그렇지 않으면 false.
     */
    boolean existsByUsername(String username);

    /**
     * 주어진 이메일 주소로 사용자를 조회합니다.
     * @param email 조회할 사용자의 이메일 주소.
     * @return 조회된 {@link User} 객체를 담은 Optional. 사용자가 없으면 Optional.empty()를 반환.
     */
    Optional<User> findByEmail(String email);

    /**
     * 주어진 이메일 주소를 가진 사용자가 존재하는지 여부를 확인합니다.
     * 회원가입 시 이메일 중복 확인 등에 사용됩니다.
     * @param email 확인할 이메일 주소.
     * @return 해당 이메일 주소의 사용자가 존재하면 true, 그렇지 않으면 false.
     */
    boolean existsByEmail(String email);
}