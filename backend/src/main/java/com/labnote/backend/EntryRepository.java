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

    // --- [수정된 부분] ---
    /**
     * 특정 사용자의 노트 중에서 제목(title - 대소문자 무시) 또는 내용(content - 대소문자 구분)에
     * 검색어가 포함된 모든 노트를 찾습니다.
     * @param user 검색할 사용자
     * @param query 검색어 (예: "DNA")
     * @return 일치하는 노트 리스트
     */
    @Query("SELECT e FROM Entry e WHERE e.user = :user AND " +
            "(LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            // [수정] e.content 주변의 LOWER() 함수 제거
            "e.content LIKE CONCAT('%', :query, '%'))")
    List<Entry> searchByUser(@Param("user") User user, @Param("query") String query);
}