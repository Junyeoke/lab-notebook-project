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
                <h2>LabLog 로그인</h2>
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
            </form>
        </div>
    );
}

export default LoginPage;