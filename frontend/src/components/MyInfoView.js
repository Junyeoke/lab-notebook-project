import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Card, Alert, Image } from 'react-bootstrap';
import Swal from 'sweetalert2';
import api, { updateUserProfile } from '../api';
import { getProfilePictureUrl } from '../utils';
import { FiCamera, FiUser, FiMail, FiSave, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';

const MyInfoView = ({ user, onUpdateUser, onAccountDeleted }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [pictureFile, setPictureFile] = useState(null);
    const [picturePreview, setPicturePreview] = useState('');
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setEmail(user.email || '');
            setPicturePreview(getProfilePictureUrl(user.picture));
        }
    }, [user]);

    if (!user) {
        return null;
    }

    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPictureFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPicturePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (username.trim() === '') {
            setError('이름을 입력하세요.');
            return;
        }

        const formData = new FormData();
        formData.append('username', username.trim());
        formData.append('email', email.trim());
        if (pictureFile) {
            formData.append('picture', pictureFile);
        }

        try {
            const response = await updateUserProfile(formData);
            onUpdateUser(response.data.token);
            Swal.fire('성공', '회원 정보가 수정되었습니다.', 'success');
            setIsEditing(false);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || '정보 수정에 실패했습니다. 다시 시도해주세요.');
            console.error(err);
        }
    };

    const handleDelete = () => {
        Swal.fire({
            title: '정말로 탈퇴하시겠습니까?',
            text: "이 작업은 되돌릴 수 없으며, 모든 데이터가 삭제됩니다.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: '네, 탈퇴하겠습니다.',
            cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete('/user/me');
                    Swal.fire('탈퇴 완료', '회원 탈퇴가 완료되었습니다. 로그인 페이지로 이동합니다.', 'success');
                    onAccountDeleted();
                } catch (err) {
                    Swal.fire('오류', '회원 탈퇴 중 오류가 발생했습니다.', 'error');
                    console.error(err);
                }
            }
        });
    };
    
    const isGoogleUser = user.provider === 'google';

    const cancelEditing = () => {
        setIsEditing(false);
        setUsername(user.username);
        setEmail(user.email);
        setPictureFile(null);
        setPicturePreview(getProfilePictureUrl(user.picture));
        setError('');
    };

    return (
        <div className="my-info-page-container">
            {/* Left Column: Profile Card */}
            <div className="my-info-profile-card">
                <div className="profile-picture-container" onClick={() => isEditing && fileInputRef.current.click()}>
                    <Image src={picturePreview} roundedCircle className="profile-picture" />
                    {isEditing && (
                        <div className="profile-picture-overlay">
                            <FiCamera size={32} />
                        </div>
                    )}
                </div>
                <h2 className="profile-username">{user.username}</h2>
                <p className="profile-email">{user.email}</p>
                <span className="provider-badge">{user.provider || 'local'}</span>
                {!isEditing && (
                    <Button variant="primary" className="mt-4 d-block mx-auto" onClick={() => setIsEditing(true)}>
                        <FiEdit2 className="me-2" /> 프로필 수정
                    </Button>
                )}
            </div>

            {/* Right Column: Settings */}
            <div className="my-info-settings-panel">
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Form onSubmit={handleUpdate} className={`settings-card ${isEditing ? 'editing' : ''}`}>
                    <h3 className="settings-card-header">계정 정보</h3>
                    <Form.Control
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePictureChange}
                        style={{ display: 'none' }}
                        accept="image/*"
                        disabled={!isEditing}
                    />
                    <Form.Group className="mb-3" controlId="formUsername">
                        <Form.Label><FiUser className="me-2"/>이름</Form.Label>
                        <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={!isEditing || isGoogleUser}
                        />
                        {isGoogleUser && (
                            <Form.Text className="text-muted">
                                Google 로그인 사용자는 이름을 변경할 수 없습니다.
                            </Form.Text>
                        )}
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label><FiMail className="me-2"/>이메일</Form.Label>
                        <Form.Control 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isEditing || isGoogleUser} 
                        />
                         {isGoogleUser && (
                            <Form.Text className="text-muted">
                                Google 로그인 사용자는 이메일을 변경할 수 없습니다.
                            </Form.Text>
                        )}
                    </Form.Group>

                    {isEditing && (
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <Button variant="secondary" onClick={cancelEditing}>
                                <FiX className="me-1" /> 취소
                            </Button>
                            <Button variant="primary" type="submit">
                                <FiSave className="me-1" /> 변경사항 저장
                            </Button>
                        </div>
                    )}
                </Form>

                <div className="settings-card danger-zone mt-4">
                    <h3 className="settings-card-header text-danger">회원 탈퇴</h3>
                    <p>계정을 삭제하면 모든 노트와 프로젝트가 영구적으로 삭제되며, 되돌릴 수 없습니다.</p>
                    <div className="d-flex justify-content-end">
                        <Button variant="danger" onClick={handleDelete}>
                            <FiTrash2 className="me-2" /> 계정 삭제
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyInfoView;
