import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import api from './api';
import { jwtDecode } from 'jwt-decode';
import Swal from 'sweetalert2'; // Swal import 확인

const AuthContext = createContext();

// 1. 타임아웃 시간 설정
const LOGOUT_TIMEOUT_DURATION = 30 * 60 * 1000; // 30분 (자동 로그아웃)
const WARNING_TIMEOUT_DURATION = 28 * 60 * 1000; // 28분 (경고 팝업)
// const LOGOUT_TIMEOUT_DURATION = 15 * 1000; // (테스트용 15초)
// const WARNING_TIMEOUT_DURATION = 10 * 1000; // (테스트용 10초)

// 경고 팝업 유지 시간 (로그아웃 시간 - 경고 시간)
const WARNING_POPUP_DURATION = LOGOUT_TIMEOUT_DURATION - WARNING_TIMEOUT_DURATION;

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);

    // 2. 타이머 ID Ref (로그아웃용, 경고용)
    const logoutTimeoutIdRef = useRef(null);
    const warningTimeoutIdRef = useRef(null);

    // 3. 로그아웃 함수 (타이머 정리 포함)
    const logout = useCallback(() => {
        // 모든 타이머 정리
        if (warningTimeoutIdRef.current) {
            clearTimeout(warningTimeoutIdRef.current);
            warningTimeoutIdRef.current = null;
        }
        if (logoutTimeoutIdRef.current) {
            clearTimeout(logoutTimeoutIdRef.current);
            logoutTimeoutIdRef.current = null;
        }
        // Swal 팝업 닫기 (만약 열려있다면)
        Swal.close();

        // 상태 및 로컬 스토리지 정리
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        console.log("Logged out.");
    }, []); // 의존성 없음

    // 4. 경고 팝업 표시 함수
    const showWarningPopup = useCallback(() => {
        // console.log("Showing warning popup."); // (디버깅)
        Swal.fire({
            title: '세션 만료 예정',
            html: `활동이 없어 ${Math.round(WARNING_POPUP_DURATION / 1000 / 60)}분 후에 자동으로 로그아웃됩니다.<br/>세션을 연장하시겠습니까?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '세션 연장',
            cancelButtonText: '로그아웃',
            confirmButtonColor: '#005a9c',
            cancelButtonColor: '#6c757d',
            // [핵심] 팝업 자동 닫힘 타이머 설정 (남은 시간)
            timer: WARNING_POPUP_DURATION,
            timerProgressBar: true, // 타이머 진행률 표시

            // 팝업이 닫힐 때 실행 (버튼 클릭, 타이머 만료, 외부 클릭 등)
        }).then((result) => {
            if (result.isConfirmed) {
                // "세션 연장" 버튼 클릭 시
                // console.log("Session extended by user."); // (디버깅)
                resetTimer(); // 타이머 재설정
            } else if (result.dismiss === Swal.DismissReason.timer) {
                // 타이머 만료 시
                console.log("Logout due to popup timer expiry."); // (디버깅)
                logout(); // 로그아웃 실행
            } else if (result.dismiss === Swal.DismissReason.cancel) {
                // "로그아웃" 버튼 클릭 시
                console.log("Logout by user cancel click."); // (디버깅)
                logout(); // 로그아웃 실행
            }
            // 그 외 (외부 클릭 등으로 닫힘) - 일단 아무것도 안 함 (다음 활동 시 타이머 리셋됨)
            // else { console.log("Warning dismissed:", result.dismiss); }
        });
    }, [logout]); // logout 함수가 변경되면 이 함수도 재생성 (거의 안 바뀜)


    // 5. 타이머 재설정 함수 (경고 + 로그아웃 타이머 모두 설정)
    const resetTimer = useCallback(() => {
        // 기존 타이머 모두 취소
        if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);
        if (logoutTimeoutIdRef.current) clearTimeout(logoutTimeoutIdRef.current);

        // 새 경고 타이머 설정
        warningTimeoutIdRef.current = setTimeout(showWarningPopup, WARNING_TIMEOUT_DURATION);
        // 새 로그아웃 타이머 설정
        logoutTimeoutIdRef.current = setTimeout(logout, LOGOUT_TIMEOUT_DURATION);

        // console.log("Inactivity timers (warning & logout) reset."); // (디버깅)
    }, [logout, showWarningPopup]); // logout 또는 showWarningPopup 함수가 바뀌면 재생성


    // 6. 활동 감지 및 타이머 관리 useEffect (resetTimer 사용)
    useEffect(() => {
        const handleActivity = () => {
            // 활동 감지 시 타이머 재설정
            resetTimer();
        };

        if (token) {
            // 초기 타이머 시작
            resetTimer();
            // 활동 이벤트 리스너 등록
            window.addEventListener('mousemove', handleActivity);
            window.addEventListener('keydown', handleActivity);
            window.addEventListener('click', handleActivity);
            window.addEventListener('scroll', handleActivity);
        } else {
            // 로그아웃 상태면 모든 타이머 클리어 (혹시 모를 경우 대비)
            if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);
            if (logoutTimeoutIdRef.current) clearTimeout(logoutTimeoutIdRef.current);
        }

        // 클린업 함수: 리스너 제거 및 타이머 클리어
        return () => {
            if (warningTimeoutIdRef.current) clearTimeout(warningTimeoutIdRef.current);
            if (logoutTimeoutIdRef.current) clearTimeout(logoutTimeoutIdRef.current);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [token, resetTimer]); // token 또는 resetTimer가 변경될 때마다 실행


    // 앱 로드 시 토큰 유효성 검사 (기존과 동일)
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedUser = jwtDecode(storedToken);
                // (만료 시간 검증 로직 추가 권장)
                setUser({ username: decodedUser.sub });
                setToken(storedToken);
                // 타이머는 위의 token 의존성 useEffect에서 자동으로 시작됨
            } catch (error) {
                localStorage.removeItem('token'); setToken(null); setUser(null);
            }
        }
    }, []);

    // 로그인 함수 (기존과 동일)
    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password });
            const newToken = response.data.token;
            localStorage.setItem('token', newToken);
            const decodedUser = jwtDecode(newToken);
            setUser({ username: decodedUser.sub });
            setToken(newToken); // 이 변경이 타이머 시작/재설정 effect를 트리거
            return { success: true };
        } catch (error) {
            console.error("로그인 실패:", error);
            const message = error.response?.data?.message || '로그인 중 알 수 없는 오류 발생';
            return { success: false, message: message };
        }
    };

    // 회원가입 함수 (기존과 동일)
    const register = async (username, password) => {
        try {
            await api.post('/auth/register', { username, password });
            return { success: true };
        } catch (error) {
            console.error("회원가입 실패:", error);
            const message = error.response?.data?.message || '회원가입 중 알 수 없는 오류 발생';
            return { success: false, message: message };
        }
    };

    // Context 값 제공 (기존과 동일)
    const value = { user, token, login, register, logout, isAuthenticated: !!token };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth 커스텀 훅 (기존과 동일)
export const useAuth = () => {
    return useContext(AuthContext);
};