package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController // 이 클래스가 REST API 컨트롤러임을 선언
@RequestMapping("/api/entries") // 이 컨트롤러의 모든 메소드는 '/api/entries' 경로 하위에 매핑됨
@CrossOrigin(origins = "http://localhost:3000") // CORS 문제 해결 (React 기본 포트 3000 허용)
public class EntryController {

    @Autowired // Spring에게 EntryRepository의 인스턴스(구현체)를 주입해달라고 요청
    private EntryRepository entryRepository;

    // 1. (C) 생성: (POST) /api/entries
    // @RequestBody: React가 보낸 JSON 데이터를 Entry 객체로 변환
    @PostMapping
    public Entry createEntry(@RequestBody Entry entry) {
        // JpaRepository의 save 메소드를 호출하여 DB에 저장
        return entryRepository.save(entry);
    }

    // 2. (R) 전체 조회: (GET) /api/entries
    @GetMapping
    public List<Entry> getAllEntries() {
        // JpaRepository의 findAll 메소드를 호출하여 모든 데이터를 리스트로 반환
        return entryRepository.findAll();
    }

    // 3. (R) 단일 조회: (GET) /api/entries/{id}
    // @PathVariable: URL 경로에 포함된 {id} 값을 long id 변수로 매핑
    @GetMapping("/{id}")
    public ResponseEntity<Entry> getEntryById(@PathVariable Long id) {
        // findById는 Optional<Entry>를 반환. (데이터가 없을 수도 있으므로)
        // orElse(null)을 사용해 찾으면 Entry 객체를, 못 찾으면 null을 반환.
        Entry entry = entryRepository.findById(id).orElse(null);

        if (entry == null) {
            // 못 찾았다면 404 Not Found 응답 반환
            return ResponseEntity.notFound().build();
        } else {
            // 찾았다면 200 OK 응답과 Entry 객체 반환
            return ResponseEntity.ok(entry);
        }
    }
}