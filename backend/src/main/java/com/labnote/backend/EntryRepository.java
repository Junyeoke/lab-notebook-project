package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional; // Optional 임포트 확인 (findByIdAndUser 때문에)

public interface EntryRepository extends JpaRepository<Entry, Long> {

    // (기존 메소드들 - findByProjectIdAndUser, findByProjectIsNullAndUser, findByUser, findByIdAndUser)
    List<Entry> findByProjectIdAndUser(Long projectId, User user);
    List<Entry> findByProjectIsNullAndUser(User user);
    List<Entry> findByUser(User user);
    Optional<Entry> findByIdAndUser(Long id, User user);

    // [수정] 검색 쿼리에 태그 검색 추가 및 content의 LOWER 제거
    @Query("SELECT DISTINCT e FROM Entry e LEFT JOIN e.tags t WHERE e.user = :user AND " +
            "(LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "e.content LIKE CONCAT('%', :query, '%') OR " +
            "LOWER(t) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Entry> searchByUser(@Param("user") User user, @Param("query") String query);
}