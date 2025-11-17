package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * {@link Entry} 엔티티에 대한 데이터베이스 연산을 처리하는 Spring Data JPA 리포지토리입니다.
 */
public interface EntryRepository extends JpaRepository<Entry, Long> {

    /**
     * 특정 프로젝트 ID에 속한 모든 실험 노트 항목을 조회합니다.
     * 이 메소드는 항목의 작성자와 관계없이 프로젝트에 속한 모든 항목을 반환합니다.
     * @param projectId 조회할 프로젝트의 ID.
     * @return 해당 프로젝트에 속한 {@link Entry} 엔티티의 리스트.
     */
    List<Entry> findByProjectId(Long projectId);

    /**
     * 특정 사용자가 작성한 항목 중, 어떤 프로젝트에도 속하지 않은 (미분류) 항목들을 조회합니다.
     * @param user 조회할 사용자.
     * @return 해당 사용자의 미분류 {@link Entry} 엔티티의 리스트.
     */
    List<Entry> findByProjectIsNullAndUser(User user);

    /**
     * 특정 사용자가 작성한 모든 실험 노트 항목을 조회합니다.
     * @param user 조회할 사용자.
     * @return 해당 사용자의 모든 {@link Entry} 엔티티의 리스트.
     */
    List<Entry> findByUser(User user);

    /**
     * 특정 ID와 사용자를 기준으로 실험 노트 항목을 조회합니다.
     * 다른 사용자의 항목에 접근하는 것을 방지하기 위해 사용됩니다.
     * @param id 조회할 항목의 ID.
     * @param user 조회할 사용자.
     * @return 조회된 {@link Entry} 객체를 담은 Optional. 항목이 없거나 소유자가 다르면 Optional.empty()를 반환.
     */
    Optional<Entry> findByIdAndUser(Long id, User user);

    /**
     * 특정 사용자의 실험 노트 항목들 중에서 주어진 키워드로 검색을 수행합니다.
     * 검색 대상은 항목의 '제목(title)', '내용(content)', 그리고 '태그(tags)'입니다.
     * 제목과 태그는 대소문자를 구분하지 않고 검색합니다.
     * @param user 검색을 수행할 사용자.
     * @param query 검색할 키워드 문자열.
     * @return 검색 조건에 맞는 {@link Entry} 엔티티의 리스트.
     */
    @Query("SELECT DISTINCT e FROM Entry e LEFT JOIN e.tags t WHERE e.user = :user AND " +
            "(LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "e.content LIKE CONCAT('%', :query, '%') OR " +
            "LOWER(t) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Entry> searchByUser(@Param("user") User user, @Param("query") String query);

    /**
     * 특정 사용자와 관련된 모든 실험 노트 항목을 삭제합니다.
     * 주로 회원 탈퇴 시 관련 데이터를 정리하기 위해 사용될 수 있습니다.
     * @param user 삭제할 항목들의 소유자.
     */
    void deleteAllByUser(User user);
}