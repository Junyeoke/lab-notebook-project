package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // username(로그인 ID)으로 사용자를 찾는 메소드
    Optional<User> findByUsername(String username);

    // [추가] username이 존재하는지 boolean으로 반환 (효율적)
    boolean existsByUsername(String username);
}