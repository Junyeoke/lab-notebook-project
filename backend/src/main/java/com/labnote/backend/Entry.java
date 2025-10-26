package com.labnote.backend;

import jakarta.persistence.*; // JPA 어노테이션 (javax.persistence에서 jakarta.persistence로 변경됨 - Spring Boot 3.x)
import lombok.Getter; // Lombok: Getter 자동 생성
import lombok.Setter; // Lombok: Setter 자동 생성
import org.hibernate.annotations.CreationTimestamp; // 생성 시간 자동 입력
import org.hibernate.annotations.UpdateTimestamp; // 수정 시간 자동 입력

import java.time.LocalDateTime; // 날짜/시간 타입

@Entity // 이 클래스가 데이터베이스 테이블과 매핑됨을 선언
@Table(name = "entries") // 테이블 이름을 'entries'로 지정
@Getter // 모든 필드의 Getter 메소드를 자동 생성
@Setter // 모든 필드의 Setter 메소드를 자동 생성
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
}