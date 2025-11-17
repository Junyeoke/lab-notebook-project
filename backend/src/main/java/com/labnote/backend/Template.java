package com.labnote.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 사용자가 반복적으로 사용하는 노트 양식을 저장하기 위한 템플릿 엔티티 클래스입니다.
 * 새로운 노트를 작성할 때 이 템플릿의 내용을 불러와 사용할 수 있습니다.
 */
@Entity
@Table(name = "templates")
@Getter
@Setter
@NoArgsConstructor
public class Template {

    /**
     * 템플릿의 고유 식별자 (Primary Key).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 템플릿의 이름.
     */
    @Column(nullable = false)
    private String name;

    /**
     * 템플릿의 내용.
     * 텍스트 에디터에서 작성된 HTML 형식의 문자열을 저장합니다.
     * 긴 텍스트를 저장할 수 있도록 {@code TEXT} 타입으로 지정됩니다.
     */
    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * 이 템플릿을 소유한 사용자.
     * {@link User} 엔티티와 다대일(N:1) 관계입니다.
     * LAZY 로딩을 사용하며, JSON 직렬화 시 무한 루프를 방지하기 위해 {@code @JsonIgnore}를 사용합니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    /**
     * 템플릿이 생성된 시간.
     * 엔티티가 처음 저장될 때 자동으로 현재 시간이 기록됩니다.
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}