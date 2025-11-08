import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// 1. 페이지 컴포넌트 임포트
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import LabNotebookApp from './LabNotebookApp'; // 기존 메인 앱
import ProtectedRoute from './ProtectedRoute'; // 라우트 가드
import OAuth2RedirectHandler from './OAuth2RedirectHandler'; // OAuth2 리디렉션 핸들러 추가

// (새로운 App.css는 필요 없음, LabNotebookApp이 App.css를, LoginPage/RegisterPage가 AuthPage.css를 사용)

function App() {
  const { isAuthenticated } = useAuth();

  return (
      <Routes>
        {/* 1. 메인 앱 (로그인 필수) */}
        <Route
            path="/"
            element={
              <ProtectedRoute>
                <LabNotebookApp />
              </ProtectedRoute>
            }
        />

        {/* 2. 로그인 페이지 */}
        <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
              // (이미 로그인했다면 메인으로 리디렉션)
            }
        />

        {/* 3. 회원가입 페이지 */}
        <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
              // (이미 로그인했다면 메인으로 리디렉션)
            }
        />

        {/* 4. OAuth2 리디렉션 처리 */}
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

        {/* 5. 그 외 모든 경로는 메인으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
  );
}

export default App;