import React, { useState, useEffect } from 'react'; // useEffect 추가
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import './AuthPage.css';
import api from './api'; // [추가] api 인스턴스 임포트

// [추가] 디바운스 훅 (LabNotebookApp.js와 동일)
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}


function RegisterPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // [추가] 아이디 중복 체크 상태
    // available: null (초기), 'checking' (확인 중), 'available' (사용 가능), 'unavailable' (사용 불가)
    const [usernameStatus, setUsernameStatus] = useState({ available: null, message: '' });

    const auth = useAuth();
    const navigate = useNavigate();

    // [추가] 디바운스된 아이디
    const debouncedUsername = useDebounce(username, 500); // 500ms (0.5초) 딜레이

    // [추가] 디바운스된 아이디(debouncedUsername)가 변경될 때마다 API 호출
    useEffect(() => {
        const checkUsername = async () => {
            // 아이디가 비어있으면 아무것도 안 함
            if (!debouncedUsername.trim()) {
                setUsernameStatus({ available: null, message: '' });
                return;
            }

            // API 호출 시작
            setUsernameStatus({ available: 'checking', message: '아이디 확인 중...' });

            try {
                const response = await api.get(`/auth/check-username?username=${debouncedUsername.trim()}`);

                if (response.data.available) {
                    setUsernameStatus({ available: 'available', message: '사용 가능한 아이디입니다.' });
                } else {
                    setUsernameStatus({ available: 'unavailable', message: '이미 사용 중인 아이디입니다.' });
                }
            } catch (error) {
                console.error("아이디 확인 오류:", error);
                setUsernameStatus({ available: 'unavailable', message: '오류: 아이디 확인에 실패했습니다.' });
            }
        };

        checkUsername();
    }, [debouncedUsername]); // debouncedUsername이 바뀔 때만 실행


    // [수정] 회원가입 제출 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 비밀번호 확인
        if (password !== confirmPassword) {
            Swal.fire('오류', '비밀번호가 일치하지 않습니다.', 'warning');
            return;
        }

        // [추가] 아이디 중복 체크 상태 확인
        if (usernameStatus.available !== 'available') {
            Swal.fire('오류', '사용 불가능한 아이디이거나 확인이 필요합니다.', 'warning');
            return;
        }

        // AuthContext의 register 함수 호출 (반환값 {success, message} 사용)
        const result = await auth.register(username, password, email);

        if (result.success) {
            Swal.fire('성공', '회원가입이 완료되었습니다! 로그인해주세요.', 'success');
            navigate('/login'); // 회원가입 성공 시 로그인 페이지로
        } else {
            // (백엔드 최종 체크에서 실패할 경우)
            Swal.fire('회원가입 실패', result.message, 'error');
            setUsernameStatus({ available: 'unavailable', message: result.message });
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
                        autoComplete="username"
                    />
                    {/* [추가] 아이디 상태 메시지 표시 */}
                    <div className={`username-status ${usernameStatus.available}`}>
                        {usernameStatus.message}
                    </div>
                </div>
                <div className="form-group">
                    <label>이메일 (Email)</label>
                    <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
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
                        autoComplete="new-password"
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
                        autoComplete="new-password"
                    />
                </div>
                <button
                    type="submit"
                    className="form-submit-btn"
                    // [추가] 아이디 확인 중이거나 사용 불가 시 버튼 비활성화
                    disabled={usernameStatus.available !== 'available'}
                >
                    회원가입
                </button>
                <div className="auth-switch">
                    이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                </div>
            </form>
        </div>
    );
}

export default RegisterPage;