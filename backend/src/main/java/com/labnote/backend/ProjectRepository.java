package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List; // [추가]
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    // [추가] 특정 사용자가 소유한 모든 프로젝트 찾기
    List<Project> findByUser(User user);

    // [추가] 특정 사용자의 특정 프로젝트 찾기 (소유권 확인용)
    Optional<Project> findByIdAndUser(Long id, User user);
}