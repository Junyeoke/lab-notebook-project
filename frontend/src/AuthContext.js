import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                // (만료 시간 검증 로직 추가 권장)
                const decodedUser = jwtDecode(storedToken);
                setUser({ username: decodedUser.sub });
                setToken(storedToken);
            } catch (error) {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            }
        }
    }, []);

    // 4. 로그인 함수 [수정됨]
    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });

            const newToken = response.data.token;
            localStorage.setItem('token', newToken);
            const decodedUser = jwtDecode(newToken);

            setUser({ username: decodedUser.sub });
            setToken(newToken);

            return { success: true }; // [수정] 성공 시 객체 반환

        } catch (error) {
            console.error("로그인 실패:", error);

            // [수정] 실패 시 'false' 대신 에러 메시지 반환
            // (백엔드 AuthController가 보낸 Map.of("message", ...)를 가져옴)
            const message = error.response?.data?.message || '로그인 중 알 수 없는 오류 발생';
            return { success: false, message: message };
        }
    };

    // 5. 회원가입 함수 [수정됨]
    const register = async (username, password) => {
        try {
            await api.post('/auth/register', { username, password });
            return { success: true }; // [수정]

        } catch (error) {
            console.error("회원가입 실패:", error);
            const message = error.response?.data?.message || '회원가입 중 알 수 없는 오류 발생';
            return { success: false, message: message }; // [수정]
        }
    };

    // 6. 로그아웃 함수 (기존과 동일)
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};