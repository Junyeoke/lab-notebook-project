package com.labnote.backend;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

/**
 * 텍스트 에디터에서 이미지 업로드 성공 후, 클라이언트에게 이미지 URL을 반환하기 위한 DTO 클래스입니다.
 */
@Getter
@Setter
@AllArgsConstructor
public class ImageUploadResponse {
    /**
     * 서버에 업로드된 이미지에 접근할 수 있는 전체 URL.
     */
    private String url;
}
