package com.labnote.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID; // 고유한 파일명 생성을 위해

@Service
public class FileStorageService {

    private final Path fileStorageLocation; // 파일이 저장될 디렉토리 경로

    // application.properties의 'file.upload-dir' 값을 주입받음
    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        // Path 객체로 변환
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            // application.properties에 지정한 디렉토리가 없으면 생성
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            // 디렉토리 생성 실패 시 예외 발생
            throw new RuntimeException("파일을 업로드할 디렉토리를 생성할 수 없습니다.", ex);
        }
    }

    /**
     * 파일을 저장하고, 고유하게 생성된 파일 이름을 반환합니다.
     * @param file React에서 전송된 MultipartFile
     * @return 서버에 저장된 고유한 파일명 (예: 123e4567-e89b-12d3-a456-426614174000_result.png)
     */
    public String storeFile(MultipartFile file) {
        // 1. 파일명 정제 (보안을 위해 경로 문자 제거)
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        // 2. 파일명 충돌 방지를 위해 고유한 ID(UUID)를 파일명 앞에 추가
        String storedFileName = UUID.randomUUID().toString() + "_" + originalFileName;

        try {
            // 3. 파일 경로 유효성 검사
            if(storedFileName.contains("..")) {
                throw new RuntimeException("파일명에 부적절한 경로 문자가 포함되어 있습니다. " + originalFileName);
            }

            // 4. 저장할 최종 경로 (디렉토리 경로 + 고유 파일명)
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);

            // 5. 파일 시스템에 파일 저장 (이미 존재하면 덮어쓰기)
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // 6. 저장된 파일명 반환
            return storedFileName;

        } catch (IOException ex) {
            throw new RuntimeException(storedFileName + " 파일을 저장할 수 없습니다. 다시 시도해 주세요.", ex);
        }
    }
}