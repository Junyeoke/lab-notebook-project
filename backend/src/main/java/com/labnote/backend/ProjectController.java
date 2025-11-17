package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.AccessDeniedException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * 프로젝트({@link Project})에 대한 CRUD 및 협업 관리를 위한 API를 제공하는 컨트롤러입니다.
 * {@code /api/projects} 경로의 요청을 담당합니다.
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EntryRepository entryRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * 현재 인증된 사용자 정보를 데이터베이스에서 조회하는 헬퍼 메소드입니다.
     * @param principal Spring Security가 제공하는 사용자 정보 객체.
     * @return 인증된 {@link User} 엔티티.
     * @throws UsernameNotFoundException 사용자를 찾을 수 없을 경우 발생.
     */
    private User getAuthenticatedUser(Principal principal) {
        String username = principal.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    /**
     * 현재 사용자가 소유하거나 협업자로 참여하고 있는 모든 프로젝트 목록을 조회합니다.
     * @param principal 현재 인증된 사용자 정보.
     * @return 사용자와 관련된 {@link Project} 객체 리스트.
     */
    @GetMapping
    public List<Project> getAllProjects(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return projectRepository.findOwnedAndSharedProjects(user);
    }

    /**
     * 새로운 프로젝트를 생성합니다.
     * 요청을 보낸 사용자가 해당 프로젝트의 소유자로 자동 설정됩니다.
     * @param project 클라이언트로부터 받은 프로젝트 정보 (이름, 설명 등).
     * @param principal 현재 인증된 사용자 정보.
     * @return 생성된 {@link Project} 객체.
     */
    @PostMapping
    public Project createProject(@RequestBody Project project, Principal principal) {
        User user = getAuthenticatedUser(principal);
        project.setOwner(user);
        return projectRepository.save(project);
    }

    /**
     * 특정 프로젝트를 삭제합니다.
     * 오직 프로젝트의 소유자만 이 작업을 수행할 수 있습니다.
     * 프로젝트가 삭제되기 전에, 해당 프로젝트에 속해 있던 모든 노트({@link Entry})들은
     * '미분류' 상태가 되도록 프로젝트 연결이 해제됩니다.
     * @param id 삭제할 프로젝트의 ID.
     * @param principal 현재 인증된 사용자 정보.
     * @return 작업 성공을 나타내는 204 No Content 응답.
     * @throws AccessDeniedException 요청자가 프로젝트의 소유자가 아니거나 프로젝트가 존재하지 않을 경우.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id, Principal principal) throws AccessDeniedException {
        User user = getAuthenticatedUser(principal);
        Project project = projectRepository.findByIdAndOwner(id, user)
                .orElseThrow(() -> new AccessDeniedException("Access denied or project not found"));

        List<Entry> entriesToUpdate = entryRepository.findByProjectId(id);
        for (Entry entry : entriesToUpdate) {
            entry.setProject(null);
            entryRepository.save(entry);
        }

        projectRepository.delete(project);
        return ResponseEntity.noContent().build();
    }

    /**
     * 특정 프로젝트에 이메일을 통해 협업자를 추가합니다.
     * 오직 프로젝트의 소유자만 이 작업을 수행할 수 있습니다.
     * @param projectId 협업자를 추가할 프로젝트의 ID.
     * @param payload 협업자로 추가할 사용자의 이메일을 담은 Map (e.g., {"email": "user@example.com"}).
     * @param principal 현재 인증된 사용자 정보.
     * @return 협업자가 추가된 후의 {@link Project} 객체.
     * @throws AccessDeniedException 요청자가 프로젝트의 소유자가 아닐 경우.
     * @throws ResponseStatusException 이메일이 제공되지 않았거나, 해당 이메일의 사용자를 찾을 수 없거나, 자기 자신을 추가하려 할 경우.
     */
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

        Project project = projectRepository.findByIdAndOwner(projectId, owner)
                .orElseThrow(() -> new AccessDeniedException("You are not the owner of this project or it does not exist."));

        User collaborator = userRepository.findByEmail(collaboratorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User with email " + collaboratorEmail + " not found."));

        if(owner.getId().equals(collaborator.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot add yourself as a collaborator.");
        }

        project.getCollaborators().add(collaborator);
        Project savedProject = projectRepository.save(project);

        return ResponseEntity.ok(savedProject);
    }
}