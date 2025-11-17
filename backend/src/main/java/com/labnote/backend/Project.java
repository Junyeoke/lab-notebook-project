package com.labnote.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 여러 실험 노트 항목({@link Entry})을 그룹화하는 프로젝트를 나타내는 JPA 엔티티 클래스입니다.
 * 프로젝트는 한 명의 소유자와 여러 명의 협업자를 가질 수 있습니다.
 */
@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
public class Project {

    /**
     * 프로젝트의 고유 식별자 (Primary Key).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 프로젝트의 이름.
     */
    @Column(nullable = false)
    private String name;

    /**
     * 프로젝트에 대한 상세 설명 (선택 사항).
     * 긴 텍스트를 저장할 수 있도록 {@code TEXT} 타입으로 지정됩니다.
     */
    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * 프로젝트가 생성된 시간.
     * 엔티티가 처음 저장될 때 자동으로 현재 시간이 기록됩니다.
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /**
     * 프로젝트가 마지막으로 수정된 시간.
     * 엔티티가 업데이트될 때마다 자동으로 현재 시간이 기록됩니다.
     */
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * 이 프로젝트에 속한 실험 노트 항목들의 목록.
     * {@link Entry} 엔티티와 일대다(1:N) 관계입니다.
     * 프로젝트가 삭제되면 관련된 모든 항목도 함께 삭제됩니다.
     * LAZY 로딩을 사용하며, JSON 직렬화 시 무한 루프를 방지하기 위해 {@code @JsonIgnore}를 사용합니다.
     */
    @OneToMany(
            mappedBy = "project",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @JsonIgnore
    private List<Entry> entries = new ArrayList<>();

    /**
     * 이 프로젝트의 소유자.
     * {@link User} 엔티티와 다대일(N:1) 관계입니다.
     * EAGER 로딩을 사용하며, JSON 직렬화 시 무한 루프를 방지하기 위해 일부 속성을 제외합니다.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"projects", "sharedProjects", "templates"})
    private User owner;

    /**
     * 이 프로젝트에 참여하는 협업자들의 집합.
     * {@link User} 엔티티와 다대다(N:M) 관계입니다.
     * 'project_collaborators'라는 별도의 조인 테이블을 통해 관계가 관리됩니다.
     * LAZY 로딩을 사용하며, JSON 직렬화 시 무한 루프를 방지하기 위해 일부 속성을 제외합니다.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "project_collaborators",
            joinColumns = @JoinColumn(name = "project_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @JsonIgnoreProperties({"projects", "sharedProjects", "templates"})
    private Set<User> collaborators = new HashSet<>();
}