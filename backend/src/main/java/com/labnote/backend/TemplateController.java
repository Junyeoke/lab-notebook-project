package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.security.Principal;
import java.util.List;

/**
 * 사용자 정의 템플릿({@link Template})에 대한 CRUD(생성, 조회, 삭제) API를 제공하는 컨트롤러입니다.
 * {@code /api/templates} 경로의 요청을 담당합니다.
 */
@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    @Autowired
    private TemplateRepository templateRepository;

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
     * 현재 인증된 사용자가 생성한 모든 템플릿 목록을 조회합니다.
     * @param principal 현재 인증된 사용자 정보.
     * @return 해당 사용자의 {@link Template} 객체 리스트.
     */
    @GetMapping
    public List<Template> getUserTemplates(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return templateRepository.findByUser(user);
    }

    /**
     * 새로운 템플릿을 생성합니다.
     * 요청을 보낸 사용자가 해당 템플릿의 소유자로 자동 설정됩니다.
     * @param templateData 클라이언트로부터 받은 템플릿 정보 (이름, 내용).
     * @param principal 현재 인증된 사용자 정보.
     * @return 생성된 {@link Template} 객체.
     */
    @PostMapping
    public Template createTemplate(@RequestBody Template templateData, Principal principal) {
        User user = getAuthenticatedUser(principal);

        Template newTemplate = new Template();
        newTemplate.setName(templateData.getName());
        newTemplate.setContent(templateData.getContent());
        newTemplate.setUser(user);

        return templateRepository.save(newTemplate);
    }

    /**
     * 특정 템플릿을 삭제합니다.
     * 오직 해당 템플릿의 소유자만 이 작업을 수행할 수 있습니다.
     * @param id 삭제할 템플릿의 ID.
     * @param principal 현재 인증된 사용자 정보.
     * @return 작업 성공을 나타내는 204 No Content 응답.
     * @throws AccessDeniedException 템플릿을 찾을 수 없거나, 요청자가 템플릿의 소유자가 아닐 경우.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id, Principal principal) throws AccessDeniedException {
        User user = getAuthenticatedUser(principal);

        Template template = templateRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new AccessDeniedException("Template not found or access denied."));

        templateRepository.delete(template);
        return ResponseEntity.noContent().build();
    }
}