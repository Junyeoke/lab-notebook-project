package com.labnote.backend;

import com.fasterxml.jackson.annotation.JsonIgnore; // 직렬화 루프 방지
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // 프로젝트 고유 ID

    @Column(nullable = false) // unique=true 속성 제거 (여러 유저가 같은 이름의 프로젝트를 가질 수 있음)
    private String name;

    @Lob // 긴 텍스트
    @Column(columnDefinition = "TEXT")
    private String description; // 프로젝트 설명 (선택)

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // --- 관계 설정 (Project가 '1', Entry가 'N') ---

    @OneToMany(
            mappedBy = "project", // 'Entry' 엔티티의 'project' 필드와 매핑됨
            cascade = CascadeType.ALL, // 프로젝트가 삭제/저장될 때 관련 Entry도... (이건 위험할 수 있음. 수정!)
            fetch = FetchType.LAZY // EAGER(즉시로딩) 대신 LAZY(지연로딩) 사용
    )
    @JsonIgnore // [중요!] API 응답 시 이 List는 제외 (무한 루프 방지)
    private List<Entry> entries = new ArrayList<>();

    // (생성자 등은 @NoArgsConstructor, @Setter로 처리)

    // --- [추가된 부분] ---
    @ManyToOne(fetch = FetchType.EAGER) // Project 조회 시 User 정보도 '즉시' 가져옴
    @JoinColumn(name = "user_id", nullable = false) // 'user_id' 외래 키, null 불가
    @JsonIgnore // Entry -> Project -> User 무한 루프 방지
    private User user; // 이 프로젝트의 소유자
}