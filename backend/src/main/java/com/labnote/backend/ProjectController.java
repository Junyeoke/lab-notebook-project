package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.AccessDeniedException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EntryRepository entryRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Principal principal) {
        String username = principal.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    @GetMapping
    public List<Project> getAllProjects(Principal principal) {
        User user = getAuthenticatedUser(principal);
        // [수정] 소유하거나 협업중인 모든 프로젝트를 반환하도록 변경
        return projectRepository.findOwnedAndSharedProjects(user);
    }

    @PostMapping
    public Project createProject(@RequestBody Project project, Principal principal) {
        User user = getAuthenticatedUser(principal);
        // 'owner'로 설정
        project.setOwner(user);
        return projectRepository.save(project);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id, Principal principal) throws AccessDeniedException {
        User user = getAuthenticatedUser(principal);
        // 'owner'로 변경된 메소드 사용
        Project project = projectRepository.findByIdAndOwner(id, user)
                .orElseThrow(() -> new AccessDeniedException("Access denied or project not found"));

        // Entry들의 프로젝트 링크 해제 로직은 EntryController로 이동하거나 유지할 수 있음
        // 여기서는 유지하겠습니다.
        // [수정] 프로젝트에 속한 모든 노트를 찾아 링크를 해제합니다 (소유자 무관).
        List<Entry> entriesToUpdate = entryRepository.findByProjectId(id);
        for (Entry entry : entriesToUpdate) {
            entry.setProject(null);
            entryRepository.save(entry);
        }

        projectRepository.delete(project);
        return ResponseEntity.noContent().build();
    }

    // --- [추가] 협업자 추가 API ---
    @PostMapping("/{projectId}/collaborators")
    public ResponseEntity<Project> addCollaborator(
            @PathVariable Long projectId,
            @RequestBody Map<String, String> payload,
            Principal principal) throws AccessDeniedException {

        User owner = getAuthenticatedUser(principal);
        String collaboratorEmail = payload.get("email");

        if (collaboratorEmail == null || collaboratorEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email must be provided");
        }

        // 1. 프로젝트를 찾고, 요청자가 소유자인지 확인
        Project project = projectRepository.findByIdAndOwner(projectId, owner)
                .orElseThrow(() -> new AccessDeniedException("You are not the owner of this project or it does not exist."));

        // 2. 이메일로 협업할 사용자를 찾음
        User collaborator = userRepository.findByEmail(collaboratorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User with email " + collaboratorEmail + " not found."));

        // 3. 자기 자신을 추가하는 경우 방지
        if(owner.getId().equals(collaborator.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot add yourself as a collaborator.");
        }

        // 4. 협업자 목록에 추가하고 저장
        project.getCollaborators().add(collaborator);
        Project savedProject = projectRepository.save(project);

        return ResponseEntity.ok(savedProject);
    }
}