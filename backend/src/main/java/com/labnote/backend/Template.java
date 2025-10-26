package com.labnote.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "templates")
@Getter
@Setter
@NoArgsConstructor
public class Template {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // Template name

    @Lob // Large content
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // Template content (HTML from editor)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore // Avoid infinite loops in API responses
    private User user; // The user who owns this template

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // No updatedAt needed for templates for now
}