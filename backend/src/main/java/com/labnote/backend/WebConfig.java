package com.labnote.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // application.properties의 'file.upload-dir' 값을 주입받음
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // URL 경로가 '/uploads/**' (예: /uploads/image.png)로 시작하는 모든 요청을
        registry.addResourceHandler("/uploads/**")
                // 실제 파일 시스템의 'file:./uploads/' 디렉토리로 매핑합니다.
                // 'file:' 접두사는 로컬 파일 시스템 경로를 의미합니다.
                .addResourceLocations("file:" + uploadDir);
    }
}