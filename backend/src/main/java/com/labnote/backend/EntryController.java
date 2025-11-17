package com.labnote.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;


import java.io.IOException;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;

/**
 * 실험 노트 항목(Entry)에 대한 CRUD 및 기타 부가 기능(검색, 파일 업로드, 버전 관리 등)을 처리하는 컨트롤러입니다.
 * {@code /api/entries} 경로의 요청을 담당합니다.
 */
@RestController
@RequestMapping("/api/entries")
public class EntryController {

    @Autowired
    private EntryRepository entryRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntryVersionRepository entryVersionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 현재 인증된 사용자 정보를 데이터베이스에서 조회하는 헬퍼 메소드입니다.
     * @param principal Spring Security가 제공하는 사용자 정보 객체.
     * @return 인증된 {@link User} 엔티티.
     * @throws UsernameNotFoundException 사용자를 찾을 수 없을 경우 발생.
     */
    private User getAuthenticatedUser(Principal principal) {
        String username = principal.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
    }

    /**
     * 새로운 실험 노트 항목을 생성합니다.
     * 항목 데이터(JSON), 프로젝트 ID, 첨부 파일을 multipart/form-data 형식으로 받습니다.
     * @param entryJson 항목의 제목, 내용 등 주요 데이터를 담은 JSON 문자열.
     * @param projectId 항목이 속할 프로젝트의 ID (선택 사항).
     * @param file 첨부할 파일 (선택 사항).
     * @param principal 현재 인증된 사용자 정보.
     * @return 생성된 {@link Entry} 객체.
     * @throws IOException JSON 파싱 또는 파일 저장 중 오류 발생 시.
     * @throws AccessDeniedException 지정된 프로젝트에 대한 접근 권한이 없을 경우.
     */
    @PostMapping
    public Entry createEntry(@RequestParam("entry") String entryJson,
                             @RequestParam(value = "projectId", required = false) Long projectId,
                             @RequestParam(value = "file", required = false) MultipartFile file,
                             Principal principal) throws IOException {
        User user = getAuthenticatedUser(principal);
        Entry entry = objectMapper.readValue(entryJson, Entry.class);
        entry.setUser(user);

        if (projectId != null) {
            Project project = projectRepository.findProjectByIdForMember(projectId, user)
                    .orElseThrow(() -> new AccessDeniedException("접근 권한이 없는 프로젝트입니다."));
            entry.setProject(project);
        } else {
            entry.setProject(null);
        }

        if (file != null && !file.isEmpty()) {
            String storedFileName = fileStorageService.storeFile(file);
            entry.setAttachedFilePath(storedFileName);
        }

        return entryRepository.save(entry);
    }

    /**
     * 사용자의 실험 노트 항목 목록을 조회합니다.
     * 프로젝트별 필터링 및 키워드 검색 기능을 지원합니다.
     * @param projectId 필터링할 프로젝트 ID. "all" (전체), "uncategorized" (미분류), 또는 특정 프로젝트 ID.
     * @param search 검색할 키워드 (제목, 내용, 태그 대상).
     * @param principal 현재 인증된 사용자 정보.
     * @return 조회 조건에 맞는 {@link Entry} 객체 리스트.
     */
    @GetMapping
    public List<Entry> getAllEntries(
            @RequestParam(value = "projectId", defaultValue = "all") String projectId,
            @RequestParam(value = "search", required = false) String search,
            Principal principal) {
        User user = getAuthenticatedUser(principal);

        if (search != null && !search.trim().isEmpty()) {
            return entryRepository.searchByUser(user, search.trim());
        }

        if ("uncategorized".equals(projectId)) {
            return entryRepository.findByProjectIsNullAndUser(user);
        }

        if (!"all".equals(projectId)) {
            try {
                Long pid = Long.parseLong(projectId);
                projectRepository.findProjectByIdForMember(pid, user)
                        .orElseThrow(() -> new AccessDeniedException("접근 권한이 없는 프로젝트입니다."));
                return entryRepository.findByProjectId(pid);
            } catch (NumberFormatException e) {
                return entryRepository.findByUser(user);
            } catch (AccessDeniedException e) {
                return List.of();
            }
        }

        return entryRepository.findByUser(user);
    }

    /**
     * ID를 기준으로 특정 실험 노트 항목 하나를 조회합니다.
     * 해당 항목에 대한 접근 권한(소유자 또는 협력자)이 있는지 확인합니다.
     * @param id 조회할 항목의 ID.
     * @param principal 현재 인증된 사용자 정보.
     * @return 조회된 {@link Entry} 객체를 담은 ResponseEntity.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Entry> getEntryById(@PathVariable Long id, Principal principal) {
        User user = getAuthenticatedUser(principal);
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

    /**
     * 기존 실험 노트 항목을 수정합니다.
     * 수정 전 내용을 {@link EntryVersion}으로 저장하여 버전 관리를 수행합니다.
     * @param id 수정할 항목의 ID.
     * @param entryJson 수정할 내용을 담은 JSON 문자열.
     * @param projectId 변경할 프로젝트 ID (선택 사항).
     * @param file 새로 첨부하거나 변경할 파일 (선택 사항).
     * @param principal 현재 인증된 사용자 정보.
     * @return 수정된 {@link Entry} 객체를 담은 ResponseEntity.
     * @throws IOException JSON 파싱 또는 파일 저장 중 오류 발생 시.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Entry> updateEntry(@PathVariable Long id,
                                             @RequestParam("entry") String entryJson,
                                             @RequestParam(value = "projectId", required = false) Long projectId,
                                             @RequestParam(value = "file", required = false) MultipartFile file,
                                             Principal principal) throws IOException {
        User user = getAuthenticatedUser(principal);
        Entry existingEntry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("노트를 찾을 수 없습니다."));

        if (existingEntry.getProject() != null) {
            Project project = existingEntry.getProject();
            if (!project.getOwner().equals(user) && !project.getCollaborators().contains(user)) {
                throw new AccessDeniedException("이 프로젝트의 노트를 수정할 권한이 없습니다.");
            }
        } else {
            if (!existingEntry.getUser().equals(user)) {
                throw new AccessDeniedException("이 노트를 수정할 권한이 없습니다.");
            }
        }

        EntryVersion newVersion = new EntryVersion();
        newVersion.setEntry(existingEntry);
        newVersion.setTitle(existingEntry.getTitle());
        newVersion.setContent(existingEntry.getContent());
        newVersion.setResearcher(existingEntry.getResearcher());
        newVersion.setTags(new ArrayList<>(existingEntry.getTags()));
        newVersion.setModifiedBy(user);
        existingEntry.getVersions().add(newVersion);

        Entry entryDetails = objectMapper.readValue(entryJson, Entry.class);
        existingEntry.setTitle(entryDetails.getTitle());
        existingEntry.setContent(entryDetails.getContent());
        existingEntry.setResearcher(entryDetails.getResearcher());
        existingEntry.setTags(entryDetails.getTags());

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

    /**
     * 실험 노트 항목을 삭제합니다.
     * 해당 항목에 대한 삭제 권한(소유자 또는 협력자)이 있는지 확인합니다.
     * @param id 삭제할 항목의 ID.
     * @param principal 현재 인증된 사용자 정보.
     * @return 작업 성공을 나타내는 204 No Content 응답.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEntry(@PathVariable Long id, Principal principal) {
        User user = getAuthenticatedUser(principal);
        Entry entry = entryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("노트를 찾을 수 없습니다."));

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

    /**
     * 텍스트 에디터 내에서 이미지를 업로드하고 해당 이미지의 URL을 반환합니다.
     * @param image 업로드할 이미지 파일.
     * @param principal 현재 인증된 사용자 정보.
     * @return 업로드된 이미지의 URL을 담은 {@link ImageUploadResponse} 객체.
     */
    @PostMapping("/images")
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestParam("image") MultipartFile image, Principal principal) {
        getAuthenticatedUser(principal);
        String storedFileName = fileStorageService.storeFile(image);
        String imageUrl = "http://localhost:8080/uploads/" + storedFileName;
        return ResponseEntity.ok(new ImageUploadResponse(imageUrl));
    }

    /**
     * 특정 실험 노트 항목의 내용을 마크다운(Markdown) 형식으로 내보냅니다.
     * @param id 내보낼 항목의 ID.
     * @param principal 현재 인증된 사용자 정보.
     * @return 마크다운 텍스트를 담은 ResponseEntity. 다운로드를 위해 Content-Disposition 헤더가 설정됩니다.
     */
    @GetMapping("/{id}/export/markdown")
    public ResponseEntity<String> exportToMarkdown(@PathVariable Long id, Principal principal) {
        User user = getAuthenticatedUser(principal);
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

        String htmlContent = entry.getContent();
        String markdownContent = FlexmarkHtmlConverter.builder().build().convert(htmlContent);
        String fileName = entry.getTitle().replaceAll("[^a-zA-Z0-9가-힣]", "-") + ".md";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/markdown; charset=UTF-8")
                .body(markdownContent);
    }

    /**
     * 특정 실험 노트 항목의 모든 버전(수정 내역) 목록을 조회합니다.
     * @param id 조회할 항목의 ID.
     * @param principal 현재 인증된 사용자 정보.
     * @return 해당 항목의 {@link EntryVersion} 리스트.
     */
    @GetMapping("/{id}/versions")
    public ResponseEntity<List<EntryVersion>> getVersions(@PathVariable Long id, Principal principal) {
        User user = getAuthenticatedUser(principal);
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

    /**
     * 실험 노트 항목을 특정 버전의 상태로 복원합니다.
     * 복원 작업 직전의 상태를 새로운 버전으로 자동 저장하여 안전장치를 마련합니다.
     * @param id 복원할 항목의 ID.
     * @param versionId 복원의 기준이 될 버전의 ID.
     * @param principal 현재 인증된 사용자 정보.
     * @return 복원된 {@link Entry} 객체.
     */
    @PostMapping("/{id}/versions/{versionId}/restore")
    public ResponseEntity<Entry> restoreVersion(@PathVariable Long id, @PathVariable Long versionId, Principal principal) {
        User user = getAuthenticatedUser(principal);
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

        if (!versionToRestore.getEntry().getId().equals(entry.getId())) {
            throw new AccessDeniedException("해당 노트의 버전이 아닙니다.");
        }

        EntryVersion preRestoreVersion = new EntryVersion();
        preRestoreVersion.setEntry(entry);
        preRestoreVersion.setTitle(entry.getTitle());
        preRestoreVersion.setContent(entry.getContent());
        preRestoreVersion.setResearcher(entry.getResearcher());
        preRestoreVersion.setTags(new ArrayList<>(entry.getTags()));
        preRestoreVersion.setModifiedBy(user);
        entry.getVersions().add(preRestoreVersion);

        entry.setTitle(versionToRestore.getTitle());
        entry.setContent(versionToRestore.getContent());
        entry.setResearcher(versionToRestore.getResearcher());
        entry.setTags(new ArrayList<>(versionToRestore.getTags()));

        Entry updatedEntry = entryRepository.save(entry);
        return ResponseEntity.ok(updatedEntry);
    }
}

/**
 * 요청된 리소스를 찾을 수 없을 때 발생하는 예외입니다.
 * 이 예외가 발생하면 클라이언트에게 404 Not Found 상태 코드가 반환됩니다.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}