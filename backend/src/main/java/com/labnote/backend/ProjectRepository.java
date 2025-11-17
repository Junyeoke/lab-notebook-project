package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * {@link Project} 엔티티에 대한 데이터베이스 연산을 처리하는 Spring Data JPA 리포지토리입니다.
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    /**
     * 특정 사용자가 소유한 모든 프로젝트를 조회합니다.
     * @param owner 프로젝트 소유자.
     * @return 해당 사용자가 소유한 {@link Project} 엔티티의 리스트.
     */
    List<Project> findByOwner(User owner);

    /**
     * 프로젝트 ID와 소유자를 기준으로 특정 프로젝트를 조회합니다.
     * 주로 프로젝트 삭제, 협업자 추가 등 소유권 확인이 필요한 작업에 사용됩니다.
     * @param id 조회할 프로젝트의 ID.
     * @param owner 프로젝트 소유자.
     * @return 조회된 {@link Project} 객체를 담은 Optional. 프로젝트가 없거나 소유자가 다르면 Optional.empty()를 반환.
     */
    Optional<Project> findByIdAndOwner(Long id, User owner);

    /**
     * 특정 사용자가 소유하고 있거나 협업자로 참여하고 있는 모든 프로젝트를 조회합니다.
     * @param user 조회할 사용자.
     * @return 사용자가 접근 가능한 모든 {@link Project} 엔티티의 리스트.
     */
    @Query("SELECT p FROM Project p WHERE p.owner = :user OR :user MEMBER OF p.collaborators")
    List<Project> findOwnedAndSharedProjects(@Param("user") User user);

    /**
     * 특정 사용자가 주어진 ID의 프로젝트에 접근 권한(소유자 또는 협업자)이 있는지 확인하고, 있다면 프로젝트를 반환합니다.
     * @param projectId 확인할 프로젝트의 ID.
     * @param user 접근 권한을 확인할 사용자.
     * @return 사용자가 접근 권한을 가진 경우 해당 {@link Project} 객체를 담은 Optional.
     */
    @Query("SELECT p FROM Project p WHERE p.id = :projectId AND (p.owner = :user OR :user MEMBER OF p.collaborators)")
    Optional<Project> findProjectByIdForMember(@Param("projectId") Long projectId, @Param("user") User user);
}