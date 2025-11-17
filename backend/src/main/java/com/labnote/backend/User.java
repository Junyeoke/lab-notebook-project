package com.labnote.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 애플리케이션의 사용자 정보를 나타내는 JPA 엔티티 클래스입니다.
 * 사용자의 인증 정보, 프로필 정보, 그리고 소유하거나 협업하는 프로젝트 및 템플릿과의 관계를 정의합니다.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    /**
     * 사용자의 고유 식별자 (Primary Key).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 사용자 이름 (로그인 ID).
     * null을 허용하지 않으며, 모든 사용자 중에서 고유해야 합니다.
     */
    @Column(nullable = false, unique = true)
    private String username;

    /**
     * 사용자 이메일 주소.
     * 모든 사용자 중에서 고유해야 합니다.
     */
    @Column(unique = true)
    private String email;

    /**
     * 사용자가 가입한 소셜 로그인 제공자 (예: "google", "github").
     * 일반 회원가입의 경우 null일 수 있습니다.
     */
    @Column
    private String provider;

    /**
     * 사용자의 비밀번호.
     * 데이터베이스에 저장될 때는 반드시 해시(Hash) 처리되어야 합니다.
     * API 응답 시 JSON 직렬화에서 제외되어 노출되지 않도록 {@code @JsonIgnore} 처리됩니다.
     */
    @Column(nullable = false)
    @JsonIgnore
    private String password;

    /**
     * 사용자의 프로필 사진 URL.
     * 소셜 로그인 사용자의 경우 제공될 수 있으며, 일반 회원의 경우 null일 수 있습니다.
     */
    @Column(nullable = true)
    private String picture;

    /**
     * 이 사용자가 소유한 프로젝트 목록.
     * {@link Project} 엔티티와 일대다(1:N) 관계입니다.
     * 사용자가 삭제되면 소유한 프로젝트도 함께 삭제됩니다.
     * LAZY 로딩을 사용하며, JSON 직렬화 시 무한 루프를 방지하기 위해 일부 속성을 제외합니다.
     */
    @OneToMany(
            mappedBy = "owner",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties({"owner", "collaborators"})
    private List<Project> projects = new ArrayList<>();

    /**
     * 이 사용자가 협업자로 참여하고 있는 프로젝트 목록.
     * {@link Project} 엔티티와 다대다(N:M) 관계입니다.
     * LAZY 로딩을 사용하며, JSON 직렬화 시 무한 루프를 방지하기 위해 일부 속성을 제외합니다.
     */
    @ManyToMany(mappedBy = "collaborators", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"owner", "collaborators"})
    private Set<Project> sharedProjects = new HashSet<>();

    /**
     * 이 사용자가 생성한 템플릿 목록.
     * {@link Template} 엔티티와 일대다(1:N) 관계입니다.
     * 사용자가 삭제되면 생성한 템플릿도 함께 삭제됩니다.
     * LAZY 로딩을 사용하며, JSON 직렬화 시 무한 루프를 방지하기 위해 {@code @JsonIgnore} 처리됩니다.
     */
    @OneToMany(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @JsonIgnore
    private List<Template> templates = new ArrayList<>();

    /**
     * 엔티티가 삭제되기 전에 호출되는 라이프사이클 콜백 메소드입니다.
     * 이 사용자가 협업자로 참여하고 있는 모든 프로젝트에서 해당 사용자의 연관 관계를 제거합니다.
     * 이는 {@code ManyToMany} 관계에서 발생할 수 있는 참조 무결성 문제를 방지합니다.
     */
    @PreRemove
    private void preRemove() {
        for (Project project : sharedProjects) {
            project.getCollaborators().remove(this);
        }
    }
}