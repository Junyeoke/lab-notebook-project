package com.labnote.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Lab-Notebook 백엔드 애플리케이션의 메인 클래스입니다.
 * Spring Boot 애플리케이션의 시작점(entry point) 역할을 합니다.
 * {@code @SpringBootApplication} 어노테이션은 다음 세 가지 어노테이션을 합친 것입니다:
 * <ul>
 *     <li>{@code @Configuration}: 이 클래스가 애플리케이션의 설정을 포함함을 나타냅니다.</li>
 *     <li>{@code @EnableAutoConfiguration}: Spring Boot가 클래스패스 설정, 다른 빈, 다양한 속성 설정을 기반으로
 *     자동으로 구성을 추가하도록 지시합니다.</li>
 *     <li>{@code @ComponentScan}: {@code com.labnote.backend} 패키지 및 하위 패키지에서
 *     다른 컴포넌트, 설정, 서비스를 찾도록 지시합니다.</li>
 * </ul>
 */
@SpringBootApplication
public class BackendApplication {

	/**
	 * 애플리케이션을 시작하는 메인 메소드입니다.
	 *
	 * @param args 커맨드 라인에서 전달되는 인자 배열입니다.
	 */
	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

}
