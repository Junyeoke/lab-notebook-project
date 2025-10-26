package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication; // [추가]
import org.springframework.security.core.userdetails.UsernameNotFoundException; // [추가]
import java.security.Principal; // [추가]
import java.nio.file.AccessDeniedException; // [추가]

import java.util.List;

@RestController
@RequestMapping("/api/projects")
// @CrossOrigin(origins = "http://localhost:3000")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EntryRepository entryRepository; // Entry의 project 링크를 끊기 위해

    @Autowired
    private UserRepository userRepository; // [추가]

    // --- [추가] 현재 로그인한 User 객체를 가져오는 헬퍼 메소드 ---
    private com.labnote.backend.User getAuthenticatedUser(Principal principal) {
        String username = principal.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다: " + username));
    }

    // 1. (R) 모든 프로젝트 조회 [수정]
    @GetMapping
    public List<Project> getAllProjects(Principal principal) { // [수정] Principal 추가
        // [수정] DB의 모든 Project가 아닌, "로그인한 유저"의 Project만 반환
        com.labnote.backend.User user = getAuthenticatedUser(principal);
        return projectRepository.findByUser(user);
    }

    // 2. (C) 새 프로젝트 생성 [수정]
    @PostMapping
    public Project createProject(@RequestBody Project project, Principal principal) { // [수정]
        com.labnote.backend.User user = getAuthenticatedUser(principal);

        // [수정] 프로젝트에 소유자(User) 설정
        project.setUser(user);

        return projectRepository.save(project);
    }

    // 3. (D) 프로젝트 삭제 [수정]
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id, Principal principal) throws AccessDeniedException { // [수정]
        com.labnote.backend.User user = getAuthenticatedUser(principal);

        // [수정] ID와 User로 프로젝트를 찾아 소유권 확인
        Project project = projectRepository.findByIdAndUser(id, user)
                .orElse(null);

        if (project == null) {
            // 프로젝트가 없거나, 내 소유가 아님
            throw new AccessDeniedException("접근 권한이 없거나 존재하지 않는 프로젝트입니다.");
        }

        // [수정] Entry들의 프로젝트 링크 해제 (findByProjectId -> findByProjectIdAndProjectUser)
        List<Entry> entriesToUpdate = entryRepository.findByProjectIdAndUser(id, user);
        for (Entry entry : entriesToUpdate) {
            entry.setProject(null);
            entryRepository.save(entry);
        }

        projectRepository.delete(project);

        return ResponseEntity.noContent().build();
    }
}