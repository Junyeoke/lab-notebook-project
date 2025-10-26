package com.labnote.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    @Autowired
    private TemplateRepository templateRepository;

    @Autowired
    private UserRepository userRepository;

    // Helper to get the current authenticated user
    private User getAuthenticatedUser(Principal principal) {
        String username = principal.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    // GET /api/templates - Get all templates for the current user
    @GetMapping
    public List<Template> getUserTemplates(Principal principal) {
        User user = getAuthenticatedUser(principal);
        return templateRepository.findByUser(user);
    }

    // POST /api/templates - Create a new template
    @PostMapping
    public Template createTemplate(@RequestBody Template templateData, Principal principal) {
        User user = getAuthenticatedUser(principal);

        Template newTemplate = new Template();
        newTemplate.setName(templateData.getName());
        newTemplate.setContent(templateData.getContent());
        newTemplate.setUser(user); // Set the owner

        return templateRepository.save(newTemplate);
    }

    // DELETE /api/templates/{id} - Delete a template
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id, Principal principal) throws AccessDeniedException {
        User user = getAuthenticatedUser(principal);

        // Find the template by ID and ensure it belongs to the current user
        Template template = templateRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new AccessDeniedException("Template not found or access denied."));

        templateRepository.delete(template);
        return ResponseEntity.noContent().build();
    }
}