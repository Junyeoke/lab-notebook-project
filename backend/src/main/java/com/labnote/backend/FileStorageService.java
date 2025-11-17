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
import java.util.UUID;

/**
 * 파일 업로드 및 저장을 처리하는 서비스 클래스입니다.
 * 업로드된 파일을 파일 시스템의 특정 위치에 저장하는 로직을 담당합니다.
 */
@Service
public class FileStorageService {

    private final Path fileStorageLocation; // 파일이 저장될 기본 디렉토리 경로

    /**
     * FileStorageService를 생성하고 파일 저장 디렉토리를 초기화합니다.
     * {@code application.properties}의 {@code file.upload-dir} 속성값을 읽어와
     * 파일 저장 위치를 설정하고, 해당 디렉토리가 존재하지 않으면 생성합니다.
     *
     * @param uploadDir {@code application.properties}에서 주입받는 업로드 디렉토리 경로.
     * @throws RuntimeException 디렉토리 생성에 실패할 경우 발생.
     */
    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("파일을 업로드할 디렉토리를 생성할 수 없습니다.", ex);
        }
    }

    /**
     * 일반 첨부 파일을 기본 저장 위치에 저장합니다.
     *
     * @param file 클라이언트로부터 전송된 {@link MultipartFile} 객체.
     * @return 서버에 저장된 고유한 파일명.
     */
    public String storeFile(MultipartFile file) {
        return store(file, this.fileStorageLocation);
    }

    /**
     * 프로필 사진 파일을 'profile_pictures' 하위 디렉토리에 저장합니다.
     * 해당 하위 디렉토리가 없으면 생성합니다.
     *
     * @param file 클라이언트로부터 전송된 프로필 사진 {@link MultipartFile} 객체.
     * @return 기본 업로드 디렉토리 기준의 상대 경로를 포함한 파일명 (e.g., "profile_pictures/unique_name.jpg").
     */
    public String storeProfilePicture(MultipartFile file) {
        Path profilePicLocation = this.fileStorageLocation.resolve("profile_pictures");
        try {
            Files.createDirectories(profilePicLocation);
        } catch (Exception ex) {
            throw new RuntimeException("프로필 사진을 업로드할 디렉토리를 생성할 수 없습니다.", ex);
        }
        String storedFileName = store(file, profilePicLocation);
        return "profile_pictures/" + storedFileName;
    }

    /**
     * 파일을 지정된 위치에 저장하는 내부 로직을 수행합니다.
     * 파일명 충돌을 피하기 위해 UUID를 사용하여 고유한 파일명을 생성합니다.
     *
     * @param file 저장할 {@link MultipartFile} 객체.
     * @param location 파일이 저장될 {@link Path} 객체.
     * @return 저장된 고유한 파일명.
     * @throws RuntimeException 파일명에 부적절한 문자가 있거나 파일 저장에 실패할 경우 발생.
     */
    private String store(MultipartFile file, Path location) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID().toString() + "_" + originalFileName;

        try {
            if (storedFileName.contains("..")) {
                throw new RuntimeException("파일명에 부적절한 경로 문자가 포함되어 있습니다. " + originalFileName);
            }

            Path targetLocation = location.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return storedFileName;

        } catch (IOException ex) {
            throw new RuntimeException(storedFileName + " 파일을 저장할 수 없습니다. 다시 시도해 주세요.", ex);
        }
    }
}