# LogLy 프로젝트 문서

## 1. 프로젝트 개요

이 프로젝트는 개인이 기록(Entry), 프로젝트, 템플릿을 관리할 수 있도록 설계된 웹 기반 노트북(노트) 애플리케이션입니다. 노트 작성, 편집, 조회, 정리 기능뿐만 아니라 사용자 인증 및 파일 첨부 기능을 제공합니다.

## 2. 사용 기술

### 백엔드 (Backend)
* **언어**: Java
* **프레임워크**: Spring Boot
* **빌드 도구**: Gradle
* **인증**: JWT (JSON Web Tokens), OAuth2 (Google)
* **데이터베이스**: MariaDB

### 프론트엔드 (Frontend)
* **프레임워크**: React.js
* **언어**: JavaScript
* **패키지 매니저**: npm
* **스타일링**: CSS (Bootstrap 컴포넌트 활용)

## 3. 인증 (Authentication)

이 애플리케이션은 로컬 사용자 이름/비밀번호 인증과 Google OAuth2 소셜 로그인을 모두 지원합니다. API 엔드포인트 보안을 위해 JWT가 사용됩니다.

## 4. 파일 업로드 (File Uploads)

사용자는 노트(Entry)에 파일(이미지, 문서)을 첨부할 수 있습니다. 업로드된 파일은 서버에 저장됩니다.

## 5. API 엔드포인트

이 섹션에서는 백엔드에서 제공하는 RESTful API 엔드포인트에 대해 설명합니다.

---

### 5.1. 인증 API (`/auth`)

* **기본 URL**: `/api/auth`

#### 1. 사용자 이름 중복 확인

* **엔드포인트**: `/api/auth/check-username`
* **메서드**: `GET`
* **설명**: 주어진 사용자 이름을 등록에 사용할 수 있는지 확인합니다.
* **요청 파라미터**:
    * `username` (쿼리 파라미터, 문자열, 필수): 확인할 사용자 이름입니다.
* **응답**:
    * `200 OK`:
        ```json
        {
            "available": true/false
        }
        ```
        * `available`: 사용 가능한 경우 `true`, 그렇지 않은 경우 `false`입니다.

#### 2. 사용자 등록 (회원가입)

* **엔드포인트**: `/api/auth/register`
* **메서드**: `POST`
* **설명**: 사용자 이름과 비밀번호로 새 사용자를 등록합니다.
* **요청 본문 (Body)**: `application/json`
    ```json
    {
        "username": "string",
        "password": "string"
    }
    ```
* **응답**:
    * `200 OK`:
        ```json
        {
            "message": "회원가입이 완료되었습니다."
        }
        ```
    * `400 Bad Request`: 사용자 이름이 이미 존재하는 경우.
        ```json
        {
            "message": "이미 존재하는 사용자 이름입니다."
        }
        ```

#### 3. 사용자 로그인

* **엔드포인트**: `/api/auth/login`
* **메서드**: `POST`
* **설명**: 사용자를 인증하고 로그인 성공 시 JWT 토큰을 반환합니다.
* **요청 본문 (Body)**: `application/json`
    ```json
    {
        "username": "string",
        "password": "string"
    }
    ```
* **응답**:
    * `200 OK`:
        ```json
        {
            "token": "jwt_token_string"
        }
        ```
        * `token`: 이후 인증된 요청에 사용될 JWT 토큰입니다.
    * `401 Unauthorized`: 인증에 실패한 경우 (예: 잘못된 사용자 이름 또는 비밀번호).
        ```json
        {
            "message": "아이디 또는 비밀번호가 잘못되었습니다."
        }
        ```

---

### 5.2. 사용자 API (`/user`)

* **기본 URL**: `/api/user`
* **인증**: `Authorization` 헤더에 유효한 JWT 토큰이 필요합니다.

#### 1. 사용자 정보 수정

* **엔드포인트**: `/api/user/me`
* **메서드**: `PUT`
* **설명**: 현재 인증된 사용자의 정보(예: 사용자 이름)를 업데이트합니다. 업데이트된 사용자 정보가 포함된 새 JWT 토큰을 반환합니다.
* **요청 본문 (Body)**: `application/json`
    ```json
    {
        "username": "string"
    }
    ```
    * `username`: 사용자의 새로운 이름입니다.
* **응답**:
    * `200 OK`:
        ```json
        {
            "token": "new_jwt_token_string"
        }
        ```
        * `token`: 업데이트된 사용자 정보를 반영하는 새 JWT 토큰입니다.
    * `400 Bad Request`: 새 사용자 이름이 이미 사용 중인 경우.
        ```json
        {
            "message": "이미 존재하는 사용자 이름입니다."
        }
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.

#### 2. 사용자 계정 삭제 (회원 탈퇴)

* **엔드포인트**: `/api/user/me`
* **메서드**: `DELETE`
* **설명**: 현재 인증된 사용자의 계정과 모든 관련 데이터(노트, 프로젝트, 템플릿)를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
* **요청 본문 (Body)**: 없음
* **응답**:
    * `200 OK`:
        ```json
        {
            "message": "회원 탈퇴가 완료되었습니다."
        }
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.

---

### 5.3. 프로젝트 API (`/projects`)

* **기본 URL**: `/api/projects`
* **인증**: `Authorization` 헤더에 유효한 JWT 토큰이 필요합니다.

#### 1. 인증된 사용자의 모든 프로젝트 조회

* **엔드포인트**: `/api/projects`
* **메서드**: `GET`
* **설명**: 현재 인증된 사용자에 속한 모든 프로젝트를 조회합니다.
* **요청 파라미터**: 없음
* **응답**:
    * `200 OK`: 프로젝트 객체 목록.
        ```json
        [
            {
                "id": Long,
                "name": "string",
                "user": {
                    "id": Long,
                    "username": "string",
                    "email": "string",
                    "provider": "string"
                }
            }
            // ... 더 많은 프로젝트 객체
        ]
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.

#### 2. 새 프로젝트 생성

* **엔드포인트**: `/api/projects`
* **메서드**: `POST`
* **설명**: 인증된 사용자를 위한 새 프로젝트를 생성합니다.
* **요청 본문 (Body)**: `application/json`
    ```json
    {
        "name": "string"
    }
    ```
    * `name`: 새 프로젝트의 이름입니다.
* **응답**:
    * `200 OK`: 생성된 프로젝트 객체.
        ```json
        {
            "id": Long,
            "name": "string",
            "user": {
                "id": Long,
                "username": "string",
                "email": "string",
                "provider": "string"
            }
        }
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.

#### 3. 프로젝트 삭제

* **엔드포인트**: `/api/projects/{id}`
* **메서드**: `DELETE`
* **설명**: ID로 프로젝트를 삭제합니다. 관련된 노트들은 프로젝트 연결이 해제됩니다('미분류' 상태로 이동). 프로젝트 소유자만 삭제할 수 있습니다.
* **요청 파라미터**:
    * `id` (경로 변수, Long, 필수): 삭제할 프로젝트의 ID입니다.
* **응답**:
    * `204 No Content`: 프로젝트가 성공적으로 삭제된 경우.
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.
    * `403 Forbidden`: 인증된 사용자가 프로젝트를 소유하고 있지 않거나 프로젝트가 존재하지 않는 경우.

---

### 5.4. 노트(Entry) API (`/entries`)

* **기본 URL**: `/api/entries`
* **인증**: `Authorization` 헤더에 유효한 JWT 토큰이 필요합니다.

#### 1. 새 노트 생성

* **엔드포인트**: `/api/entries`
* **메서드**: `POST`
* **설명**: 인증된 사용자를 위한 새 노트를 생성합니다. 파일 첨부 및 프로젝트 연결을 지원합니다.
* **요청 본문 (Body)**: `multipart/form-data`
    * `entry` (폼 데이터, JSON 문자열, 필수): `Entry` 객체를 나타내는 JSON 문자열입니다.
        ```json
        {
            "title": "string",
            "content": "string",
            "researcher": "string",
            "tags": ["string", "string"]
        }
        ```
    * `projectId` (폼 데이터, Long, 선택 사항): 노트와 연결할 프로젝트의 ID입니다.
    * `file` (폼 데이터, File, 선택 사항): 노트에 첨부할 파일입니다.
* **응답**:
    * `200 OK`: 생성된 `Entry` 객체.
        ```json
        {
            "id": Long,
            "title": "string",
            "content": "string",
            "researcher": "string",
            "tags": ["string"],
            "createdAt": "ISO_DATE_TIME",
            "updatedAt": "ISO_DATE_TIME",
            "project": { ... Project 객체 ... }, // 선택 사항
            "attachedFilePath": "string" // 선택 사항
        }
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.
    * `403 Forbidden`: 제공된 `projectId`가 인증된 사용자에게 속하지 않는 경우.

#### 2. 모든 노트 조회 (필터링/검색)

* **엔드포인트**: `/api/entries`
* **메서드**: `GET`
* **설명**: 인증된 사용자의 노트를 조회하며, 선택적으로 프로젝트별 필터링 또는 제목, 내용, 자, 태그 키워드 검색을 지원합니다.
* **요청 파라미터**:
    * `projectId` (쿼리 파라미터, 문자열, 선택 사항): 프로젝트 ID로 노트를 필터링합니다.
        * `"all"` (기본값): 모든 노트를 조회합니다.
        * `"uncategorized"`: 어떤 프로젝트와도 연결되지 않은 노트를 조회합니다.
        * `Long`: 지정된 프로젝트 ID와 연결된 노트를 조회합니다.
    * `search` (쿼리 파라미터, 문자열, 선택 사항): 제목, 내용, 자 또는 태그로 노트를 필터링할 검색 키워드입니다. `search`가 제공되면 `projectId`는 무시됩니다.
* **응답**:
    * `200 OK`: `Entry` 객체 목록.
        ```json
        [
            {
                "id": Long,
                "title": "string",
                "content": "string",
                "researcher": "string",
                "tags": ["string"],
                "createdAt": "ISO_DATE_TIME",
                "updatedAt": "ISO_DATE_TIME",
                "project": { ... Project 객체 ... }, // 선택 사항
                "attachedFilePath": "string" // 선택 사항
            }
            // ... 더 많은 노트 객체
        ]
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.

#### 3. ID로 단일 노트 조회

* **엔드포인트**: `/api/entries/{id}`
* **메서드**: `GET`
* **설명**: ID로 단일 노트를 조회하며, 해당 노트가 인증된 사용자에게 속해 있는지 확인합니다.
* **요청 파라미터**:
    * `id` (경로 변수, Long, 필수): 조회할 노트의 ID입니다.
* **응답**:
    * `200 OK`: `Entry` 객체.
        ```json
        {
            "id": Long,
            "title": "string",
            "content": "string",
            "researcher": "string",
            "tags": ["string"],
            "createdAt": "ISO_DATE_TIME",
            "updatedAt": "ISO_DATE_TIME",
            "project": { ... Project 객체 ... }, // 선택 사항
            "attachedFilePath": "string" // 선택 사항
        }
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.
    * `403 Forbidden`: 인증된 사용자가 노트를 소유하고 있지 않거나 노트가 존재하지 않는 경우.

#### 4. 기존 노트 수정

* **엔드포인트**: `/api/entries/{id}`
* **메서드**: `PUT`
* **설명**: 기존 노트를 수정합니다. 수정 전에 노트의 새 버전이 자동으로 저장됩니다. 파일 첨부 및 프로젝트 연결 업데이트를 지원합니다.
* **요청 파라미터**:
    * `id` (경로 변수, Long, 필수): 수정할 노트의 ID입니다.
* **요청 본문 (Body)**: `multipart/form-data`
    * `entry` (폼 데이터, JSON 문자열, 필수): 업데이트된 `Entry` 객체를 나타내는 JSON 문자열입니다.
        ```json
        {
            "title": "string",
            "content": "string",
            "researcher": "string",
            "tags": ["string", "string"]
        }
        ```
    * `projectId` (폼 데이터, Long, 선택 사항): 노트와 연결할 프로젝트의 ID입니다.
    * `file` (폼 데이터, File, 선택 사항): 노트에 첨부할 새 파일입니다 (기존 파일을 대체함).
* **응답**:
    * `200 OK`: 업데이트된 `Entry` 객체.
        ```json
        {
            "id": Long,
            "title": "string",
            "content": "string",
            "researcher": "string",
            "tags": ["string"],
            "createdAt": "ISO_DATE_TIME",
            "updatedAt": "ISO_DATE_TIME",
            "project": { ... Project 객체 ... }, // 선택 사항
            "attachedFilePath": "string" // 선택 사항
        }
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.
    * `403 Forbidden`: 인증된 사용자가 노트를 소유하고 있지 않거나 제공된 `projectId`가 사용자에게 속하지 않는 경우.

#### 5. 노트 삭제

* **엔드포인트**: `/api/entries/{id}`
* **메서드**: `DELETE`
* **설명**: ID로  노트를 삭제하며, 해당 노트가 인증된 사용자에게 속해 있는지 확인합니다.
* **요청 파라미터**:
    * `id` (경로 변수, Long, 필수): 삭제할 노트의 ID입니다.
* **응답**:
    * `204 No Content`: 노트가 성공적으로 삭제된 경우.
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.
    * `403 Forbidden`: 인증된 사용자가 노트를 소유하고 있지 않거나 노트가 존재하지 않는 경우.

#### 6. 에디터용 이미지 업로드

* **엔드포인트**: `/api/entries/images`
* **메서드**: `POST`
* **설명**: 이미지 파일을 업로드합니다. 주로 리치 텍스트 에디터가 노트 내용에 이미지를 직접 삽입할 때 사용합니다.
* **요청 본문 (Body)**: `multipart/form-data`
    * `image` (폼 데이터, File, 필수): 업로드할 이미지 파일입니다.
* **응답**:
    * `200 OK`:
        ```json
        {
            "url": "string" // 업로드된 이미지의 URL
        }
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.

#### 7. 노트를 Markdown으로 내보내기

* **엔드포인트**: `/api/entries/{id}/export/markdown`
* **메서드**: `GET`
* **설명**: 특정 노트의 내용을 Markdown 파일로 내보냅니다.
* **요청 파라미터**:
    * `id` (경로 변수, Long, 필수): 내보낼 노트의 ID입니다.
* **응답**:
    * `200 OK`: Markdown 파일 형태의 노트 내용 (`Content-Type: text/markdown`).
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.
    * `403 Forbidden`: 인증된 사용자가 노트를 소유하고 있지 않거나 노트가 존재하지 않는 경우.

#### 8. 노트 버전 기록 조회

* **엔드포인트**: `/api/entries/{id}/versions`
* **메서드**: `GET`
* **설명**: 특정 노트의 버전 기록을 조회합니다.
* **요청 파라미터**:
    * `id` (경로 변수, Long, 필수): 노트의 ID입니다.
* **응답**:
    * `200 OK`: `EntryVersion` 객체 목록.
        ```json
        [
            {
                "id": Long,
                "title": "string",
                "content": "string",
                "researcher": "string",
                "tags": ["string"],
                "versionTimestamp": "ISO_DATE_TIME"
            }
            // ... 더 많은 버전 객체
        ]
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.
    * `403 Forbidden`: 인증된 사용자가 노트를 소유하고 있지 않거나 노트가 존재하지 않는 경우.

#### 9. 특정 버전으로 노트 복원

* **엔드포인트**: `/api/entries/{id}/versions/{versionId}/restore`
* **메서드**: `POST`
* **설명**: 노트를 이전 버전으로 복원합니다. 복원하기 전에 노트의 현재 상태가 새 버전으로 저장됩니다.
* **요청 파라미터**:
    * `id` (경로 변수, Long, 필수): 복원할 노트의 ID입니다.
    * `versionId` (경로 변수, Long, 필수): 복원하려는 대상 버전의 ID입니다.
* **응답**:
    * `200 OK`: 복원된 `Entry` 객체.
        ```json
        {
            "id": Long,
            "title": "string",
            "content": "string",
            "researcher": "string",
            "tags": ["string"],
            "createdAt": "ISO_DATE_TIME",
            "updatedAt": "ISO_DATE_TIME",
            "project": { ... Project 객체 ... }, // 선택 사항
            "attachedFilePath": "string" // 선택 사항
        }
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.
    * `403 Forbidden`: 인증된 사용자가 노트를 소유하고 있지 않거나, 노트/버전이 존재하지 않거나, 버전이 해당 노트에 속하지 않는 경우.
    * `404 Not Found`: 지정된 버전이 존재하지 않는 경우.

---

### 5.5. 템플릿 API (`/templates`)

* **기본 URL**: `/api/templates`
* **인증**: `Authorization` 헤더에 유효한 JWT 토큰이 필요합니다.

#### 1. 인증된 사용자의 모든 템플릿 조회

* **엔드포인트**: `/api/templates`
* **메서드**: `GET`
* **설명**: 현재 인증된 사용자에 속한 모든 템플릿을 조회합니다.
* **요청 파라미터**: 없음
* **응답**:
    * `200 OK`: 템플릿 객체 목록.
        ```json
        [
            {
                "id": Long,
                "name": "string",
                "content": "string",
                "user": {
                    "id": Long,
                    "username": "string",
                    "email": "string",
                    "provider": "string"
                }
            }
            // ... 더 많은 템플릿 객체
        ]
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.

#### 2. 새 템플릿 생성

* **엔드포인트**: `/api/templates`
* **메서드**: `POST`
* **설명**: 인증된 사용자를 위한 새 템플릿을 생성합니다.
* **요청 본문 (Body)**: `application/json`
    ```json
    {
        "name": "string",
        "content": "string"
    }
    ```
    * `name`: 새 템플릿의 이름입니다.
    * `content`: 템플릿의 내용입니다 (예: HTML 또는 Markdown).
* **응답**:
    * `200 OK`: 생성된 템플릿 객체.
        ```json
        {
            "id": Long,
            "name": "string",
            "content": "string",
            "user": {
                "id": Long,
                "username": "string",
                "email": "string",
                "provider": "string"
            }
        }
        ```
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.

#### 3. 템플릿 삭제

* **엔드포인트**: `/api/templates/{id}`
* **메서드**: `DELETE`
* **설명**: ID로 템플릿을 삭제합니다. 템플릿 소유자만 삭제할 수 있습니다.
* **요청 파라미터**:
    * `id` (경로 변수, Long, 필수): 삭제할 템플릿의 ID입니다.
* **응답**:
    * `204 No Content`: 템플릿이 성공적으로 삭제된 경우.
    * `401 Unauthorized`: 유효한 JWT 토큰이 제공되지 않은 경우.
    * `403 Forbidden`: 인증된 사용자가 템플릿을 소유하고 있지 않거나 템플릿이 존재하지 않는 경우.