package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TemplateRepository extends JpaRepository<Template, Long> {

    // Find all templates owned by a specific user
    List<Template> findByUser(User user);

    // Find a specific template by ID and owner (for deletion/update checks)
    Optional<Template> findByIdAndUser(Long id, User user);
}