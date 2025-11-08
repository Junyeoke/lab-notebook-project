package com.labnote.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor; // 1. [수정] 기본 생성자 import
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity // 이 클래스가 데이터베이스 테이블과 매핑됨을 선언
@Table(name = "entries") // 테이블 이름을 'entries'로 지정
@Getter // 모든 필드의 Getter 메소드를 자동 생성
@Setter // 모든 필드의 Setter 메소드를 자동 생성
@NoArgsConstructor // 2. [수정] ObjectMapper가 JSON을 객체로 변환할 때 필요한 기본 생성자 추가
public class Entry {

    @Id // 이 필드가 Primary Key(기본키)임을 선언
    @GeneratedValue(strategy = GenerationType.IDENTITY) // DB가 ID를 자동 생성 (Auto-Increment)
    private Long id; // 실험 기록 고유 ID

    @Column(nullable = false) // 'title' 컬럼, null을 허용하지 않음
    private String title; // 실험 제목

    @Lob // 대용량 텍스트를 저장할 수 있도록 지정 (VARCHAR 대신 TEXT 타입 등)
    @Column(nullable = false, columnDefinition = "TEXT") // 'content' 컬럼, null 불가, DB 타입을 TEXT로 명시
    private String content; // 실험 내용 (본문)

    @Column(nullable = true) // 'researcher' 컬럼, null 허용
    private String researcher; // 실험자 이름

    @CreationTimestamp // 데이터가 처음 생성될 때 현재 시간을 자동으로 저장
    @Column(updatable = false) // 이 필드는 업데이트(수정) 시 변경되지 않음
    private LocalDateTime createdAt; // 생성 일시

    @UpdateTimestamp // 데이터가 수정될 때 현재 시간을 자동으로 저장
    private LocalDateTime updatedAt; // 수정 일시

    @ElementCollection(fetch = FetchType.EAGER) // [추가]
    @CollectionTable(name = "entry_tags", joinColumns = @JoinColumn(name = "entry_id")) // [추가]
    @Column(name = "tag") // [추가]
    private List<String> tags = new ArrayList<>(); // [추가] 태그 목록

    @Column(nullable = true) // 파일은 선택 사항이므로 null 허용
    private String attachedFilePath; // 서버에 저장된 파일의 이름 (또는 경로)

    // --- [추가된 부분] ---
    @ManyToOne(fetch = FetchType.EAGER) // Entry를 조회할 때 Project 정보도 '즉시' 가져옴
    @JoinColumn(name = "project_id", nullable = true) // DB에 'project_id'라는 외래 키 컬럼 생성
    private Project project; // 이 Entry가 속한 Project 객체

    // --- [추가된 부분] ---
    @ManyToOne(fetch = FetchType.LAZY) // Entry 조회 시 User를 항상 가져올 필요는 없음 (LAZY)
    @JoinColumn(name = "user_id", nullable = false) // 'user_id' 외래 키, null 불가
    @JsonIgnore
    private User user; // 이 노트의 소유자

    @OneToMany(mappedBy = "entry", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore // Entry 조회 시 모든 버전을 가져오지 않도록 설정 (필요 시 별도 API로 조회)
    private List<EntryVersion> versions = new ArrayList<>();
}