package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * {@link EntryVersion} 엔티티에 대한 데이터베이스 연산을 처리하는 Spring Data JPA 리포지토리입니다.
 */
public interface EntryVersionRepository extends JpaRepository<EntryVersion, Long> {

    /**
     * 특정 실험 노트 항목({@link Entry})에 속한 모든 버전 기록을 조회합니다.
     * 버전이 생성된 시간(versionTimestamp)을 기준으로 내림차순(최신순)으로 정렬합니다.
     *
     * @param entry 버전 기록을 조회할 원본 {@link Entry} 객체.
     * @return 조회된 {@link EntryVersion} 엔티티의 리스트.
     */
    List<EntryVersion> findByEntryOrderByVersionTimestampDesc(Entry entry);
}
