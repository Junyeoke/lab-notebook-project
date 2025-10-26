package com.labnote.backend;

import com.fasterxml.jackson.databind.ObjectMapper; // JSON 문자열을 객체로 변환하기 위해
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // 파일 수신을 위해

import java.io.IOException; // IOException 처리
import java.security.Principal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/entries")
// @CrossOrigin(origins = "http://localhost:3000")
public class EntryController {

    @Autowired
    private EntryRepository entryRepository;

    // [추가] FileStorageService 주입
    @Autowired
    private FileStorageService fileStorageService;

    // [추가] ProjectRepository 주입
    @Autowired
    private ProjectRepository projectRepository;

    @Autowired private UserRepository userRepository; // [추가]

    // [추가] JSON 문자열 <-> Java 객체 변환기
    private final ObjectMapper objectMapper = new ObjectMapper();

    // --- [추가] 현재 로그인한 User 객체를 가져오는 헬퍼 메소드 ---
    private com.labnote.backend.User getAuthenticatedUser(Principal principal) {
        String username = principal.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
    }

    // 1. (C) 생성 [수정]
    @PostMapping
    public Entry createEntry(@RequestParam("entry") String entryJson,
                             @RequestParam(value = "projectId", required = false) Long projectId,
                             @RequestParam(value = "file", required = false) MultipartFile file,
                             Principal principal) throws IOException, AccessDeniedException { // [수정]

        com.labnote.backend.User user = getAuthenticatedUser(principal);
        Entry entry = objectMapper.readValue(entryJson, Entry.class);

        // [수정] Entry에 소유자(User) 설정
        entry.setUser(user);

        if (projectId != null) {
            // [수정] 내가 소유한 프로젝트가 맞는지 확인
            Project project = projectRepository.findByIdAndUser(projectId, user)
                    .orElseThrow(() -> new AccessDeniedException("접근 권한이 없는 프로젝트입니다."));
            entry.setProject(project);
        } else {
            entry.setProject(null); // 미분류
        }

        if (file != null && !file.isEmpty()) {
            String storedFileName = fileStorageService.storeFile(file);
            entry.setAttachedFilePath(storedFileName);
        }

        return entryRepository.save(entry);
    }

    // 2. (R) 전체/필터/검색 조회 [핵심 수정]
    @GetMapping
    public List<Entry> getAllEntries(
            // [수정] 2개의 옵셔널 파라미터를 받도록 변경
            @RequestParam(value = "projectId", defaultValue = "all") String projectId,
            @RequestParam(value = "search", required = false) String search,
            Principal principal) {

        com.labnote.backend.User user = getAuthenticatedUser(principal);

        // 1순위: 검색어(search)가 있으면, 검색을 최우선으로 실행
        if (search != null && !search.trim().isEmpty()) {
            return entryRepository.searchByUser(user, search.trim());
        }

        // 2순위: 검색어가 없고, projectId로 필터링
        // '미분류'
        if ("uncategorized".equals(projectId)) {
            return entryRepository.findByProjectIsNullAndUser(user);
        }

        // '특정 프로젝트 ID'
        if (!"all".equals(projectId)) {
            try {
                Long pid = Long.parseLong(projectId);
                return entryRepository.findByProjectIdAndUser(pid, user);
            } catch (NumberFormatException e) {
                // projectId가 숫자가 아니면 '전체'로 간주
                return entryRepository.findByUser(user);
            }
        }

        // 3순위: '전체' (search 없고, projectId == 'all')
        return entryRepository.findByUser(user);
    }

    // 3. (R) 단일 조회 [수정]
    @GetMapping("/{id}")
    public ResponseEntity<Entry> getEntryById(@PathVariable Long id, Principal principal) throws AccessDeniedException { // [수정]
        com.labnote.backend.User user = getAuthenticatedUser(principal);
        // [수정] ID와 User로 노트 소유권 확인
        Entry entry = entryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new AccessDeniedException("접근 권TOC한이 없거나 존재하지 않는 노트입니다."));

        return ResponseEntity.ok(entry);
    }

    // 4. (U) 수정 [수정]
    @PutMapping("/{id}")
    public ResponseEntity<Entry> updateEntry(@PathVariable Long id,
                                             @RequestParam("entry") String entryJson,
                                             @RequestParam(value = "projectId", required = false) Long projectId,
                                             @RequestParam(value = "file", required = false) MultipartFile file,
                                             Principal principal) throws IOException, AccessDeniedException { // [수정]

        com.labnote.backend.User user = getAuthenticatedUser(principal);

        // [수정] ID와 User로 기존 노트 소유권 확인
        Entry existingEntry = entryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new AccessDeniedException("접근 권한이 없거나 존재하지 않는 노트입니다."));

        Entry entryDetails = objectMapper.readValue(entryJson, Entry.class);

        // 필드 업데이트
        existingEntry.setTitle(entryDetails.getTitle());
        existingEntry.setContent(entryDetails.getContent());
        existingEntry.setResearcher(entryDetails.getResearcher());

        // 프로젝트 업데이트 (소유권 확인 포함)
        if (projectId != null) {
            Project project = projectRepository.findByIdAndUser(projectId, user)
                    .orElseThrow(() -> new AccessDeniedException("접근 권한이 없는 프로젝트입니다."));
            existingEntry.setProject(project);
        } else {
            existingEntry.setProject(null);
        }

        if (file != null && !file.isEmpty()) {
            String storedFileName = fileStorageService.storeFile(file);
            existingEntry.setAttachedFilePath(storedFileName);
        }

        Entry updatedEntry = entryRepository.save(existingEntry);
        return ResponseEntity.ok(updatedEntry);
    }

    // 5. (D) 삭제 [수정]
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id, Principal principal) throws AccessDeniedException { // [수정]
        com.labnote.backend.User user = getAuthenticatedUser(principal);

        // [수정] ID와 User로 노트 소유권 확인
        Entry entry = entryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new AccessDeniedException("접근 권한이 없거나 존재하지 않는 노트입니다."));

        entryRepository.delete(entry);
        return ResponseEntity.noContent().build();
    }
}