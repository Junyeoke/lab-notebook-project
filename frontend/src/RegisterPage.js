import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import './AuthPage.css'; // (로그인/회원가입 공용 CSS)

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const auth = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            Swal.fire('오류', '비밀번호가 일치하지 않습니다.', 'warning');
            return;
        }

        const success = await auth.register(username, password);
        if (success) {
            Swal.fire('성공', '회원가입이 완료되었습니다! 로그인해주세요.', 'success');
            navigate('/login'); // 회원가입 성공 시 로그인 페이지로
        } else {
            Swal.fire('회원가입 실패', '이미 사용 중인 아이디일 수 있습니다.', 'error');
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>회원가입</h2>
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
                <div className="form-group">
                    <label>비밀번호 확인</label>
                    <input
                        type="password"
                        className="form-input"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="form-submit-btn">회원가입</button>
                <div className="auth-switch">
                    이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                </div>
            </form>
        </div>
    );
}

export default RegisterPage;