package com.labnote.backend;

import com.fasterxml.jackson.databind.ObjectMapper; // JSON 문자열을 객체로 변환하기 위해
import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile; // 파일 수신을 위해

import java.io.IOException; // IOException 처리
import java.security.Principal;
import java.util.ArrayList;
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
    
        @Autowired
        private UserRepository userRepository;
    
        @Autowired
        private EntryVersionRepository entryVersionRepository; // [추가]
    
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
                // [수정] 내가 소유하거나 협업중인 프로젝트가 맞는지 확인
                Project project = projectRepository.findProjectByIdForMember(projectId, user)
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
                    // [핵심 수정] 프로젝트 접근 권한 확인
                    projectRepository.findProjectByIdForMember(pid, user)
                            .orElseThrow(() -> new AccessDeniedException("접근 권한이 없는 프로젝트입니다."));
                    // 권한이 있으면 해당 프로젝트의 모든 노트를 반환
                    return entryRepository.findByProjectId(pid);
                } catch (NumberFormatException e) {
                    // projectId가 숫자가 아니면 '전체'로 간주
                    return entryRepository.findByUser(user);
                } catch (AccessDeniedException e) {
                    // 권한 없는 프로젝트 접근 시 빈 리스트 반환 또는 예외 처리
                    // 여기서는 빈 리스트를 반환하여 UI에서 자연스럽게 처리하도록 함
                    return List.of();
                }
            }
    
            // 3순위: '전체' (search 없고, projectId == 'all')
            return entryRepository.findByUser(user);
        }
    
        // 3. (R) 단일 조회 [수정]
            @GetMapping("/{id}")
            public ResponseEntity<Entry> getEntryById(@PathVariable Long id, Principal principal) throws AccessDeniedException { // [수정]
                com.labnote.backend.User user = getAuthenticatedUser(principal);
        
                // [핵심 수정] 권한 확인 로직 변경
                Entry entry = entryRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("노트를 찾을 수 없습니다."));
        
                if (entry.getProject() != null) {
                    Project project = entry.getProject();
                    if (!project.getOwner().equals(user) && !project.getCollaborators().contains(user)) {
                        throw new AccessDeniedException("이 프로젝트의 노트에 접근할 권한이 없습니다.");
                    }
                } else {
                    if (!entry.getUser().equals(user)) {
                        throw new AccessDeniedException("이 노트에 접근할 권한이 없습니다.");
                    }
                }
        
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
                
                    // [수정] ID로 노트를 먼저 찾음
                    Entry existingEntry = entryRepository.findById(id)
                            .orElseThrow(() -> new ResourceNotFoundException("노트를 찾을 수 없습니다.")); // 404 Not Found
                
                    // [핵심 수정] 노트에 대한 수정 권한 확인
                    // 1. 노트가 특정 프로젝트에 속해있는 경우
                    if (existingEntry.getProject() != null) {
                        Project project = existingEntry.getProject();
                        // 사용자가 프로젝트의 소유자도 아니고, 협업자도 아니면 접근 거부
                        if (!project.getOwner().equals(user) && !project.getCollaborators().contains(user)) {
                            throw new AccessDeniedException("이 프로젝트의 노트를 수정할 권한이 없습니다.");
                        }
                    }
                    // 2. 노트가 미분류인 경우 (어떤 프로젝트에도 속하지 않음)
                    else {
                        // 기존 로직과 동일: 노트의 소유자만 수정 가능
                        if (!existingEntry.getUser().equals(user)) {
                            throw new AccessDeniedException("이 노트를 수정할 권한이 없습니다.");
                        }
                    }
                
                 // --- [추가] 버전 기록 생성 ---
                 EntryVersion newVersion = new EntryVersion();
                 newVersion.setEntry(existingEntry);
                 newVersion.setTitle(existingEntry.getTitle());
                 newVersion.setContent(existingEntry.getContent());
                 newVersion.setResearcher(existingEntry.getResearcher());
                 newVersion.setTags(new ArrayList<>(existingEntry.getTags())); // 현재 태그 복사
                 newVersion.setModifiedBy(user); // [핵심 추가] 수정한 사용자 정보 저장
                 existingEntry.getVersions().add(newVersion);
                 // --- 버전 기록 끝 ---    
            Entry entryDetails = objectMapper.readValue(entryJson, Entry.class);
    
            // 필드 업데이트
            existingEntry.setTitle(entryDetails.getTitle());
            existingEntry.setContent(entryDetails.getContent());
            existingEntry.setResearcher(entryDetails.getResearcher());
            existingEntry.setTags(entryDetails.getTags());
    
            // 프로젝트 업데이트 (소유권 및 협업자 권한 확인 포함)
            if (projectId != null) {
                Project project = projectRepository.findProjectByIdForMember(projectId, user)
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

        // [수정] ID로 노트를 먼저 찾음
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("노트를 찾을 수 없습니다."));

        // [핵심 수정] 노트에 대한 삭제 권한 확인
        if (entry.getProject() != null) {
            Project project = entry.getProject();
            if (!project.getOwner().equals(user) && !project.getCollaborators().contains(user)) {
                throw new AccessDeniedException("이 프로젝트의 노트를 삭제할 권한이 없습니다.");
            }
        } else {
            if (!entry.getUser().equals(user)) {
                throw new AccessDeniedException("이 노트를 삭제할 권한이 없습니다.");
            }
        }

        entryRepository.delete(entry);
        return ResponseEntity.noContent().build();
    }

    // 6. [추가] 텍스트 에디터에서 이미지 업로드 처리
    @PostMapping("/images")
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestParam("image") MultipartFile image, Principal principal) {
        // 인증된 사용자인지 확인 (업로드 권한 체크)
        getAuthenticatedUser(principal);

        // 파일을 저장하고 저장된 파일명을 받음
        String storedFileName = fileStorageService.storeFile(image);

        // 클라이언트에게 반환할 전체 URL 구성
        // (주의: 실제 프로덕션에서는 request에서 호스트명을 동적으로 가져오는 것이 좋음)
        String imageUrl = "http://localhost:8080/uploads/" + storedFileName;

        // URL을 담은 응답 객체 반환
        return ResponseEntity.ok(new ImageUploadResponse(imageUrl));
    }

    // 7. [추가] 마크다운으로 내보내기
    @GetMapping("/{id}/export/markdown")
    public ResponseEntity<String> exportToMarkdown(@PathVariable Long id, Principal principal) throws AccessDeniedException {
        com.labnote.backend.User user = getAuthenticatedUser(principal);

        // [핵심 수정] 권한 확인 로직 변경
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("노트를 찾을 수 없습니다."));

        if (entry.getProject() != null) {
            Project project = entry.getProject();
            if (!project.getOwner().equals(user) && !project.getCollaborators().contains(user)) {
                throw new AccessDeniedException("이 프로젝트의 노트에 접근할 권한이 없습니다.");
            }
        } else {
            if (!entry.getUser().equals(user)) {
                throw new AccessDeniedException("이 노트에 접근할 권한이 없습니다.");
            }
        }

        // HTML을 Markdown으로 변환
        String htmlContent = entry.getContent();
        String markdownContent = FlexmarkHtmlConverter.builder().build().convert(htmlContent);

        // 파일 이름으로 사용할 수 있도록 제목을 slugify
        String fileName = entry.getTitle().replaceAll("[^a-zA-Z0-9가-힣]", "-") + ".md";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/markdown; charset=UTF-8")
                .body(markdownContent);
    }

    // 8. [추가] 버전 기록 조회
    @GetMapping("/{id}/versions")
    public ResponseEntity<List<EntryVersion>> getVersions(@PathVariable Long id, Principal principal) throws AccessDeniedException {
        com.labnote.backend.User user = getAuthenticatedUser(principal);

        // [핵심 수정] 권한 확인 로직 변경
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("노트를 찾을 수 없습니다."));

        if (entry.getProject() != null) {
            Project project = entry.getProject();
            if (!project.getOwner().equals(user) && !project.getCollaborators().contains(user)) {
                throw new AccessDeniedException("이 프로젝트의 노트에 접근할 권한이 없습니다.");
            }
        } else {
            if (!entry.getUser().equals(user)) {
                throw new AccessDeniedException("이 노트에 접근할 권한이 없습니다.");
            }
        }

        List<EntryVersion> versions = entryVersionRepository.findByEntryOrderByVersionTimestampDesc(entry);
        return ResponseEntity.ok(versions);
    }

    // 9. [추가] 특정 버전으로 복원
    @PostMapping("/{id}/versions/{versionId}/restore")
    public ResponseEntity<Entry> restoreVersion(@PathVariable Long id, @PathVariable Long versionId, Principal principal) throws AccessDeniedException {
        com.labnote.backend.User user = getAuthenticatedUser(principal);

        // [핵심 수정] 권한 확인 로직 변경
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("노트를 찾을 수 없습니다."));

        if (entry.getProject() != null) {
            Project project = entry.getProject();
            if (!project.getOwner().equals(user) && !project.getCollaborators().contains(user)) {
                throw new AccessDeniedException("이 프로젝트의 노트를 복원할 권한이 없습니다.");
            }
        } else {
            if (!entry.getUser().equals(user)) {
                throw new AccessDeniedException("이 노트를 복원할 권한이 없습니다.");
            }
        }

        EntryVersion versionToRestore = entryVersionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("해당 버전을 찾을 수 없습니다."));

        // 복원하려는 버전이 해당 엔트리의 버전이 맞는지 확인
        if (!versionToRestore.getEntry().getId().equals(entry.getId())) {
            throw new AccessDeniedException("해당 노트의 버전이 아닙니다.");
        }

        // 복원 직전의 상태를 또 다른 버전으로 저장 (안전장치)
        EntryVersion preRestoreVersion = new EntryVersion();
        preRestoreVersion.setEntry(entry);
        preRestoreVersion.setTitle(entry.getTitle());
        preRestoreVersion.setContent(entry.getContent());
        preRestoreVersion.setResearcher(entry.getResearcher());
        preRestoreVersion.setTags(new ArrayList<>(entry.getTags()));
        entry.getVersions().add(preRestoreVersion);

        // 선택한 버전의 내용으로 현재 엔트리를 덮어쓰기
        entry.setTitle(versionToRestore.getTitle());
        entry.setContent(versionToRestore.getContent());
        entry.setResearcher(versionToRestore.getResearcher());
        entry.setTags(new ArrayList<>(versionToRestore.getTags()));

        Entry updatedEntry = entryRepository.save(entry);
        return ResponseEntity.ok(updatedEntry);
    }
}

// [추가] 간단한 예외 클래스
@ResponseStatus(org.springframework.http.HttpStatus.NOT_FOUND)
class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}


        