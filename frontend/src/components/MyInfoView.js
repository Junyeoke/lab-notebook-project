import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Card, Alert, Image } from 'react-bootstrap';
import Swal from 'sweetalert2';
import api, { updateUserProfile } from '../api';
import { getProfilePictureUrl } from '../utils';
import { FiCamera } from 'react-icons/fi';

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

    return (
        <div className="my-info-view">
            <Card>
                <Card.Header as="h2">내 정보</Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleUpdate}>
                        <Form.Group className="mb-4 text-center">
                            <div className="profile-picture-container" onClick={() => isEditing && fileInputRef.current.click()}>
                                <Image src={picturePreview || '/default-profile.png'} roundedCircle className="profile-picture" />
                                {isEditing && (
                                    <div className="profile-picture-overlay">
                                        <FiCamera size={24} />
                                    </div>
                                )}
                            </div>
                            <Form.Control
                                type="file"
                                ref={fileInputRef}
                                onChange={handlePictureChange}
                                style={{ display: 'none' }}
                                accept="image/*"
                                disabled={!isEditing}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formEmail">
                            <Form.Label>이메일</Form.Label>
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

                        <Form.Group className="mb-3" controlId="formUsername">
                            <Form.Label>이름</Form.Label>
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

                        {isEditing ? (
                            <div>
                                <Button variant="primary" type="submit" className="me-2">
                                    저장
                                </Button>
                                <Button variant="secondary" onClick={() => {
                                    setIsEditing(false);
                                    setUsername(user.username);
                                    setEmail(user.email);
                                    setPictureFile(null);
                                    setPicturePreview(getProfilePictureUrl(user.picture));
                                    setError('');
                                }}>
                                    취소
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline-primary" onClick={() => setIsEditing(true)}>
                                정보 수정
                            </Button>
                        )}
                    </Form>
                    <hr />
                    <div className="danger-zone mt-4">
                        <h5>회원탈퇴</h5>
                        <p>계정을 삭제하면 모든 노트와 프로젝트가 영구적으로 삭제됩니다.</p>
                        <Button variant="danger" onClick={handleDelete}>
                            회원 탈퇴
                        </Button>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default MyInfoView;
