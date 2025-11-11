package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    // User 객체로 그 유저가 생성한 모든 프로젝트를 찾는 메소드
    List<Project> findByOwner(User owner);

    // ID와 User 객체로 특정 프로젝트를 찾는 메소드 (소유권 확인용)
    Optional<Project> findByIdAndOwner(Long id, User owner);

    // [추가] 사용자가 소유하거나 협업중인 모든 프로젝트를 찾는 메소드
    @Query("SELECT p FROM Project p WHERE p.owner = :user OR :user MEMBER OF p.collaborators")
    List<Project> findOwnedAndSharedProjects(@Param("user") User user);
    // [수정] ID와 User로 프로젝트를 찾되, 소유자 또는 협업자인지 확인하는 명시적 쿼리
    @Query("SELECT p FROM Project p WHERE p.id = :projectId AND (p.owner = :user OR :user MEMBER OF p.collaborators)")
    Optional<Project> findProjectByIdForMember(@Param("projectId") Long projectId, @Param("user") User user);
}