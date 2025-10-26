package com.labnote.backend;

import com.fasterxml.jackson.databind.ObjectMapper; // JSON 문자열을 객체로 변환하기 위해
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // 파일 수신을 위해

import java.io.IOException; // IOException 처리
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/entries")
@CrossOrigin(origins = "http://localhost:3000")
public class EntryController {

    @Autowired
    private EntryRepository entryRepository;

    // [추가] FileStorageService 주입
    @Autowired
    private FileStorageService fileStorageService;

    // [추가] JSON 문자열 <-> Java 객체 변환기
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 1. (C) 생성: [수정됨]
    // @RequestBody 대신 @RequestParam을 사용하여 'entry' (JSON 문자열)와 'file' (파일)을 받음
    @PostMapping
    public Entry createEntry(@RequestParam("entry") String entryJson,
                             @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        // 1. React가 보낸 JSON 문자열(entryJson)을 Entry 객체로 변환
        Entry entry = objectMapper.readValue(entryJson, Entry.class);

        // 2. 파일이 함께 전송되었는지 확인
        if (file != null && !file.isEmpty()) {
            // 3. 파일을 서버에 저장하고, 저장된 파일명을 반환받음
            String storedFileName = fileStorageService.storeFile(file);
            // 4. Entry 객체에 파일 경로(이름) 설정
            entry.setAttachedFilePath(storedFileName);
        }

        // 5. DB에 Entry 객체 저장 (파일 경로 포함)
        return entryRepository.save(entry);
    }

    // 2. (R) 전체 조회: (기존과 동일)
    @GetMapping
    public List<Entry> getAllEntries() {
        return entryRepository.findAll();
    }

    // 3. (R) 단일 조회: (기존과 동일)
    @GetMapping("/{id}")
    public ResponseEntity<Entry> getEntryById(@PathVariable Long id) {
        Optional<Entry> entry = entryRepository.findById(id);
        return entry.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 4. (U) 수정: [수정됨]
    @PutMapping("/{id}")
    public ResponseEntity<Entry> updateEntry(@PathVariable Long id,
                                             @RequestParam("entry") String entryJson,
                                             @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        // 1. 수정할 기존 데이터를 DB에서 조회
        Optional<Entry> optionalEntry = entryRepository.findById(id);

        if (optionalEntry.isPresent()) {
            // 2. React가 보낸 JSON 문자열(entryJson)을 새 Entry 객체(entryDetails)로 변환
            Entry entryDetails = objectMapper.readValue(entryJson, Entry.class);
            // 3. 기존 객체(existingEntry) 가져오기
            Entry existingEntry = optionalEntry.get();

            // 4. 기존 객체의 필드를 새 정보로 업데이트
            existingEntry.setTitle(entryDetails.getTitle());
            existingEntry.setContent(entryDetails.getContent());
            existingEntry.setResearcher(entryDetails.getResearcher());

            // 5. 새 파일이 전송되었는지 확인
            if (file != null && !file.isEmpty()) {
                // (참고: 기존 파일이 있다면 삭제하는 로직을 추가할 수 있습니다)
                // 6. 새 파일을 서버에 저장하고, 저장된 파일명을 반환받음
                String storedFileName = fileStorageService.storeFile(file);
                // 7. Entry 객체에 새 파일 경로(이름) 설정 (기존 파일명 덮어쓰기)
                existingEntry.setAttachedFilePath(storedFileName);
            }

            // 8. DB에 수정된 Entry 객체 저장
            Entry updatedEntry = entryRepository.save(existingEntry);
            return ResponseEntity.ok(updatedEntry);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // 5. (D) 삭제: (기존과 동일)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id) {
        // (참고: 삭제 시 DB에서 파일 경로를 읽어와 서버에 저장된 실제 파일도 삭제하는 로직을 추가할 수 있습니다)
        Optional<Entry> optionalEntry = entryRepository.findById(id);
        if (optionalEntry.isPresent()) {
            entryRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}