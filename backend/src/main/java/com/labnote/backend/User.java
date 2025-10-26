package com.labnote.backend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

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

    @Column(nullable = false)
    @JsonIgnore // API 응답 시 비밀번호는 절대 노출되지 않도록 함
    private String password; // 해시(Hash)되어 저장될 비밀번호

    // [추가] 사용자가 작성한 프로젝트 목록 (User '1' : Project 'N')
    @OneToMany(
            mappedBy = "user", // Project.java의 'user' 필드와 매핑
            fetch = FetchType.LAZY
    )
    @JsonIgnore // 프로젝트 조회 시 유저를, 유저 조회 시 프로젝트를... 무한 루프 방지
    private List<Project> projects = new ArrayList<>();

    // (권한(Role) 필드를 추가하여 'ADMIN', 'USER' 등을 구분할 수 있지만,
    //  지금은 단순화를 위해 생략합니다.)
}