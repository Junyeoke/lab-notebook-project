package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// JpaRepository<[매핑할 Entity], [Entity의 ID 타입]>
public interface EntryRepository extends JpaRepository<Entry, Long> {

    // JpaRepository가 기본 제공:
    // 1. save(Entry entry): 생성 (C)
    // 2. findById(Long id): 단일 조회 (R)
    // 3. findAll(): 전체 조회 (R)
    // 4. deleteById(Long id): 삭제 (D)
}