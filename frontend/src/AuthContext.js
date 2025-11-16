import React, { createContext, useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import api, { setupInterceptors } from './api';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2';

const AuthContext = createContext();

// 타임아웃 설정 (원본 값 유지)
const LOGOUT_TIMEOUT_DURATION = 30 * 60 * 1000; // 30분
const WARNING_TIMEOUT_DURATION = 28 * 60 * 1000; // 28분
const WARNING_POPUP_DURATION = LOGOUT_TIMEOUT_DURATION - WARNING_TIMEOUT_DURATION;

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    const logoutTimeoutIdRef = useRef(null);
    const warningTimeoutIdRef = useRef(null);

    // Logout (타이머 정리 포함)
    const logout = useCallback(() => {
        if (warningTimeoutIdRef.current) {
            clearTimeout(warningTimeoutIdRef.current);
            warningTimeoutIdRef.current = null;
        }
        if (logoutTimeoutIdRef.current) {
            clearTimeout(logoutTimeoutIdRef.current);
            logoutTimeoutIdRef.current = null;
        }
        Swal.close();
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        console.log('Logged out.');
    }, []);

    // 경고 팝업
    const showWarningPopup = useCallback(() => {
        Swal.fire({
            title: '세션 만료 예정',
            html: `활동이 없어 ${Math.round(WARNING_POPUP_DURATION / 1000 / 60)}분 후에 자동으로 로그아웃됩니다.<br/>세션을 연장하시겠습니까?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '세션 연장',
            cancelButtonText: '로그아웃',
            confirmButtonColor: '#005a9c',
            cancelButtonColor: '#6c757d',
            timer: WARNING_POPUP_DURATION,
            timerProgressBar: true
        }).then((result) => {
            if (result.isConfirmed) {
                resetTimer(); // 사용자 연장
            } else if (result.dismiss === Swal.DismissReason.timer) {
                console.log('Logout due to popup timer expiry.');
                logout();
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                console.log('Logout by user cancel click.');
                logout();
            }
        });
    }, [logout]);

    // 타이머 재설정
    const resetTimer = useCallback(() => {
        if (warningTimeoutIdRef.current) {
            clearTimeout(warningTimeoutIdRef.current);
            warningTimeoutIdRef.current = null;
        }
        if (logoutTimeoutIdRef.current) {
            clearTimeout(logoutTimeoutIdRef.current);
            logoutTimeoutIdRef.current = null;
        }

        warningTimeoutIdRef.current = setTimeout(showWarningPopup, WARNING_TIMEOUT_DURATION);
        logoutTimeoutIdRef.current = setTimeout(logout, LOGOUT_TIMEOUT_DURATION);
    }, [logout, showWarningPopup]);

    // 활동 감지 및 이벤트 등록
    useEffect(() => {
        // API 인터셉터 설정
        setupInterceptors(logout);

        const handleActivity = () => {
            resetTimer();
        };

        if (token) {
            resetTimer();
            window.addEventListener('mousemove', handleActivity);
            window.addEventListener('keydown', handleActivity);
            window.addEventListener('click', handleActivity);
            window.addEventListener('scroll', handleActivity);
        } else {
            if (warningTimeoutIdRef.current) {
                clearTimeout(warningTimeoutIdRef.current);
                warningTimeoutIdRef.current = null;
            }
            if (logoutTimeoutIdRef.current) {
                clearTimeout(logoutTimeoutIdRef.current);
                logoutTimeoutIdRef.current = null;
            }
        }

        return () => {
            if (warningTimeoutIdRef.current) {
                clearTimeout(warningTimeoutIdRef.current);
                warningTimeoutIdRef.current = null;
            }
            if (logoutTimeoutIdRef.current) {
                clearTimeout(logoutTimeoutIdRef.current);
                logoutTimeoutIdRef.current = null;
            }
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [token, resetTimer]);

    // 앱 로드 시 토큰 유효성 검사 (토큰 변경시에만 상태 세팅)
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedUser = jwtDecode(storedToken);
                const { sub: username, picture, email, provider } = decodedUser;
                setToken(storedToken);
                setUser({ username, picture, email, provider });
            } catch (error) {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            }
        } else {
            setToken(null);
            setUser(null);
        }
    }, []);

    // 로그인 (서버)
    const login = useCallback(async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const newToken = response.data.token;
            if (!newToken) throw new Error('No token returned from server');
            
            localStorage.setItem('token', newToken);
            const decodedUser = jwtDecode(newToken);
            const { sub: decodedUsername, picture, email, provider } = decodedUser;

            setToken(newToken);
            setUser({ username: decodedUsername, picture, email, provider });

            return { success: true };
        } catch (error) {
            console.error('로그인 실패:', error);
            const message = error.response?.data?.message || '로그인 중 알 수 없는 오류 발생';
            return { success: false, message };
        }
    }, []);

    // 로그인 (토큰으로)
    const loginWithToken = useCallback((newToken) => {
        if (!newToken || newToken === token) {
            return;
        }
        
        localStorage.setItem('token', newToken);
        try {
            const decodedUser = jwtDecode(newToken);
            const { sub: username, picture, email, provider } = decodedUser;
            
            setToken(newToken);
            setUser({ username, picture, email, provider });

        } catch (error) {
            console.error('Invalid token:', error);
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
        }
    }, [token]);

    // 회원가입
    const register = useCallback(async (username, password) => {
        try {
            await api.post('/auth/register', { username, password });
            return { success: true };
        } catch (error) {
            console.error('회원가입 실패:', error);
            const message = error.response?.data?.message || '회원가입 중 알 수 없는 오류 발생';
            return { success: false, message };
        }
    }, []);

    // Context value: 함수들(useCallback)과 값들(user, token) 포함
    const value = useMemo(() => ({
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        loginWithToken
    }), [user, token, login, register, logout, loginWithToken]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};