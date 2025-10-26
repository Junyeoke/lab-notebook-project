import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css'; // (기본 App.css가 모든 걸 처리하므로 삭제해도 됨)
import App from './App';
import { AuthProvider } from './AuthContext'; // [추가]
import { BrowserRouter } from 'react-router-dom'; // [추가]

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter> { /* [추가] 라우터 */ }
            <AuthProvider> { /* [추가] AuthProvider가 App을 감쌈 */ }
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);