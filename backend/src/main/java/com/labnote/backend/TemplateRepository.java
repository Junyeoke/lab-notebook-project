package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * {@link Template} 엔티티에 대한 데이터베이스 연산을 처리하는 Spring Data JPA 리포지토리입니다.
 */
@Repository
public interface TemplateRepository extends JpaRepository<Template, Long> {

    /**
     * 특정 사용자가 소유한 모든 템플릿을 조회합니다.
     * @param user 템플릿 소유자.
     * @return 해당 사용자가 소유한 {@link Template} 엔티티의 리스트.
     */
    List<Template> findByUser(User user);

    /**
     * 템플릿 ID와 소유자를 기준으로 특정 템플릿을 조회합니다.
     * 주로 템플릿 삭제 또는 수정 시 소유권 확인을 위해 사용됩니다.
     * @param id 조회할 템플릿의 ID.
     * @param user 템플릿 소유자.
     * @return 조회된 {@link Template} 객체를 담은 Optional. 템플릿이 없거나 소유자가 다르면 Optional.empty()를 반환.
     */
    Optional<Template> findByIdAndUser(Long id, User user);
}