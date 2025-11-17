package com.labnote.backend;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 실험 노트 항목({@link Entry})의 특정 시점 버전을 저장하는 JPA 엔티티 클래스입니다.
 * 항목이 수정될 때마다 이전 상태가 이 엔티티로 기록되어, 수정 내역 추적 및 복원 기능을 지원합니다.
 */
@Entity
@Table(name = "entry_versions")
@Getter
@Setter
@NoArgsConstructor
public class EntryVersion {

    /**
     * 버전의 고유 식별자 (Primary Key).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 이 버전이 속한 원본 실험 노트 항목.
     * {@link Entry} 엔티티와 다대일(N:1) 관계입니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private Entry entry;

    /**
     * 해당 버전에서의 제목.
     */
    @Column(nullable = false)
    private String title;

    /**
     * 해당 버전에서의 내용.
     * 긴 텍스트를 저장할 수 있도록 {@code TEXT} 타입으로 지정됩니다.
     */
    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * 해당 버전에서의 실험자 이름.
     */
    private String researcher;

    /**
     * 해당 버전에서의 태그 목록.
     * 별도의 'entry_version_tags' 테이블에 저장됩니다.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "entry_version_tags", joinColumns = @JoinColumn(name = "version_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    /**
     * 이 버전이 생성된 시간.
     * 엔티티가 저장될 때 자동으로 현재 시간이 기록됩니다.
     */
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime versionTimestamp;

    /**
     * 이 버전을 생성한 (즉, 항목을 수정한) 사용자.
     * {@link User} 엔티티와 다대일(N:1) 관계입니다.
     * JSON 직렬화 시 무한 순환 참조를 방지하기 위해 일부 속성을 제외합니다.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "modified_by_user_id")
    @JsonIgnoreProperties({"projects", "sharedProjects", "templates"})
    private User modifiedBy;
}
