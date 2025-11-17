package com.labnote.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

/**
 * 웹 관련 설정을 담당하는 클래스입니다.
 * 주로 정적 리소스 핸들러와 CORS(Cross-Origin Resource Sharing) 정책을 구성합니다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * {@code application.properties} 파일에서 {@code file.upload-dir} 속성값을 주입받아
     * 파일 업로드 디렉토리 경로를 설정합니다.
     */
    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * 정적 리소스 핸들러를 추가하여 특정 URL 경로로 접근 시
     * 실제 파일 시스템의 디렉토리에서 파일을 제공하도록 설정합니다.
     * 예를 들어, {@code /uploads/**} 경로로 들어오는 요청은 {@code ./uploads/} 디렉토리의 파일을 찾습니다.
     *
     * @param registry 리소스 핸들러를 등록하는 데 사용되는 {@link ResourceHandlerRegistry} 객체.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDir);
    }

    /**
     * 전역 CORS(Cross-Origin Resource Sharing) 설정을 추가합니다.
     * 이를 통해 다른 도메인(예: 프론트엔드 애플리케이션)에서 백엔드 API에 접근할 수 있도록 허용합니다.
     *
     * @param registry CORS 매핑을 등록하는 데 사용되는 {@link CorsRegistry} 객체.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**") // '/api' 하위의 모든 경로에 CORS 적용
                .allowedOrigins("http://localhost:3000") // React 앱이 실행되는 주소 허용
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 허용할 HTTP 메소드
                .allowedHeaders("*") // 모든 헤더 허용
                .allowCredentials(true); // 자격 증명(쿠키, HTTP 인증 등) 허용
    }
}