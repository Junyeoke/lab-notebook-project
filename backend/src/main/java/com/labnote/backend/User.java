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

@Entity
@Table(name = "users") // 'user'는 DB 예약어일 수 있으므로 'users' 사용
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username; // 로그인 ID

    @Column(unique = true) // 이메일도 유니크해야 함
    private String email;

    @Column
    private String provider; // e.g., "google", "github"

    @Column(nullable = false)
    @JsonIgnore // API 응답 시 비밀번호는 절대 노출되지 않도록 함
    private String password; // 해시(Hash)되어 저장될 비밀번호

    @Column(nullable = true) // 소셜 로그인의 경우에만 값이 있을 수 있음
    private String picture; // 프로필 사진 URL

    // [수정] 사용자가 '소유한' 프로젝트 목록
    @OneToMany(
            mappedBy = "owner", // Project.java의 'owner' 필드와 매핑
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @JsonIgnoreProperties({"owner", "collaborators"}) // 무한 루프 방지
    private List<Project> projects = new ArrayList<>();

    // [추가] 사용자가 '협업하는' 프로젝트 목록
    @ManyToMany(mappedBy = "collaborators", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"owner", "collaborators"}) // 무한 루프 방지
    private Set<Project> sharedProjects = new HashSet<>();


    @OneToMany(
            mappedBy = "user",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @JsonIgnore
    private List<Template> templates = new ArrayList<>();

    @PreRemove
    private void preRemove() {
        // 이 사용자가 협업자로 참여하고 있는 모든 프로젝트에서 연관 관계 제거
        for (Project project : sharedProjects) {
            project.getCollaborators().remove(this);
        }
    }

    // (권한(Role) 필드를 추가하여 'ADMIN', 'USER' 등을 구분할 수 있지만,
    //  지금은 단순화를 위해 생략합니다.)
}