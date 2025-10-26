import React from 'react';
import { useAuth } from './AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        // 1. 로그인되어 있지 않으면
        // 2. /login 페이지로 리디렉션
        // 3. (state: { from: location } -> 로그인 후 원래 가려던 페이지로 돌려보내기 위함)
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 4. 로그인되어 있으면 자식 컴포넌트(LabNotebookApp)를 렌더링
    return children;
}

export default ProtectedRoute;