package com.labnote.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 개별 실험 노트 항목을 나타내는 JPA 엔티티 클래스입니다.
 * 하나의 실험 기록에 대한 모든 정보를 담고 있습니다.
 */
@Entity
@Table(name = "entries")
@Getter
@Setter
@NoArgsConstructor
public class Entry {

    /**
     * 실험 노트 항목의 고유 식별자 (Primary Key).
     * 데이터베이스에서 자동으로 생성됩니다 (Auto-increment).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 실험의 제목.
     */
    @Column(nullable = false)
    private String title;

    /**
     * 실험의 상세 내용.
     * 긴 텍스트를 저장할 수 있도록 {@code TEXT} 타입으로 지정됩니다.
     */
    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * 실험을 수행한 연구원의 이름.
     */
    @Column(nullable = true)
    private String researcher;

    /**
     * 항목이 처음 생성된 시간.
     * 엔티티가 처음 저장될 때 자동으로 현재 시간이 기록됩니다.
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    /**
     * 항목이 마지막으로 수정된 시간.
     * 엔티티가 업데이트될 때마다 자동으로 현재 시간이 기록됩니다.
     */
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    /**
     * 항목과 관련된 태그 목록.
     * 별도의 'entry_tags' 테이블에 저장됩니다.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "entry_tags", joinColumns = @JoinColumn(name = "entry_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    /**
     * 항목에 첨부된 파일의 서버 내 저장 경로 또는 이름.
     */
    @Column(nullable = true)
    private String attachedFilePath;

    /**
     * 이 항목이 속한 프로젝트.
     * {@link Project} 엔티티와 다대일(N:1) 관계입니다.
     * EAGER 로딩 전략을 사용하여 항목 조회 시 항상 프로젝트 정보를 함께 가져옵니다.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = true)
    private Project project;

    /**
     * 이 항목을 작성한 사용자 (소유자).
     * {@link User} 엔티티와 다대일(N:1) 관계입니다.
     * LAZY 로딩 전략을 사용하며, JSON 직렬화 시 무한 루프를 방지하기 위해 {@code @JsonIgnore}를 사용합니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    /**
     * 이 항목의 모든 버전(수정 내역) 목록.
     * {@link EntryVersion} 엔티티와 일대다(1:N) 관계입니다.
     * 항목이 삭제되면 관련된 모든 버전도 함께 삭제됩니다.
     * LAZY 로딩 전략을 사용하며, JSON 직렬화 시 무한 루프를 방지하기 위해 {@code @JsonIgnore}를 사용합니다.
     */
    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<EntryVersion> versions = new ArrayList<>();
}