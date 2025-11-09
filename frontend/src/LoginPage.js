import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import './AuthPage.css';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const auth = useAuth();
    const navigate = useNavigate();

    // [수정] handleSubmit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // AuthContext의 login 함수는 이제 { success: true } 또는
        // { success: false, message: '...' }를 반환합니다.
        const result = await auth.login(username, password);

        if (result.success) {
            navigate('/'); // 로그인 성공
        } else {
            // [수정] 백엔드에서 받은 구체적인 에러 메시지를 표시
            Swal.fire('로그인 실패', result.message, 'error');
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>LogLy 로그인</h2>
                <div className="form-group">
                    <label>아이디 (Username)</label>
                    <input
                        type="text"
                        className="form-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>비밀번호 (Password)</label>
                    <input
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="form-submit-btn">로그인</button>
                <div className="auth-switch">
                    계정이 없으신가요? <Link to="/register">회원가입</Link>
                </div>
                <div className="social-login-separator">
                    <span className="separator-text">또는</span>
                </div>
                <div className="social-login-buttons">
                    <button onClick={() => window.location.href='http://localhost:8080/oauth2/authorization/google'} className="google-login-btn">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                            <path fill="none" d="M0 0h48v48H0z"></path>
                        </svg>
                        Google 계정으로 로그인
                    </button>
                </div>
            </form>
        </div>
    );
}

export default LoginPage;