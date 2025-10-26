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

// 2. 응답 인터셉터 [수정됨]
api.interceptors.response.use(
    (response) => {
        // 성공 응답은 그대로 반환
        return response;
    },
    (error) => {
        // [수정] 401 오류 처리 로직
        if (error.response && error.response.status === 401) {

            const currentPath = window.location.pathname;

            // [핵심] 현재 페이지가 /login 이나 /register가 아닐 때만
            // (즉, 이미 로그인된 상태에서 토큰이 만료되었을 때만)
            if (currentPath !== '/login' && currentPath !== '/register') {

                localStorage.removeItem('token');
                // (AuthContext의 logout을 호출하는 것이 더 좋지만,
                //  여기서는 AuthContext에 접근할 수 없으므로 강제 리디렉션)
                window.location.href = '/login';
                console.error("인증 실패 (401). 토큰 만료. 로그아웃 처리됩니다.");
            }
            // (만약 현재 페이지가 /login 또는 /register라면?
            //  -> 아무것도 안하고 에러를 그대로 반환시켜야 함)
        }

        // 401이 아니거나, /login 페이지에서 발생한 401 에러를 그대로 반환
        return Promise.reject(error);
    }
);

export default api;