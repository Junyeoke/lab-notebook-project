import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
});

// 1. 요청 인터셉터 (기존과 동일)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 2. 응답 인터셉터 설정 함수
export const setupInterceptors = (logout) => {
    api.interceptors.response.use(
        // 성공 응답은 그대로 반환
        (response) => response,
        // 실패 응답 처리
        (error) => {
            // 401 Unauthorized 에러인 경우 (토큰 만료 등)
            if (error.response && error.response.status === 401) {
                const currentPath = window.location.pathname;
                // 로그인/회원가입 페이지가 아닌 경우에만 로그아웃 처리
                if (currentPath !== '/login' && currentPath !== '/register') {
                    console.error("인증 실패 (401). 토큰이 만료되었거나 유효하지 않습니다. 자동 로그아웃됩니다.");
                    logout(); // AuthContext의 logout 함수 호출
                }
            }
            // 다른 모든 에러는 그대로 반환
            return Promise.reject(error);
        }
    );
};

// ... (기존 코드)

export const PROJECT_API_URL = '/projects';
export const TEMPLATE_API_URL = '/templates';
export const ENTRY_API_URL = '/entries';
export const UPLOAD_URL = '/entries/upload-image';

// --- 협업 기능 API ---
/**
 * 프로젝트에 협업자를 추가합니다.
 * @param {number} projectId - 프로젝트 ID
 * @param {string} email - 추가할 사용자의 이메일
 * @returns {Promise<object>} - 업데이트된 프로젝트 객체
 */
export const addCollaborator = (projectId, email) => {
    return api.post(`${PROJECT_API_URL}/${projectId}/collaborators`, { email });
};


export default api;