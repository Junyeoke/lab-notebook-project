import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import Swal from 'sweetalert2';
import api from '../api';

const MyInfoView = ({ user, onUpdateUser, onAccountDeleted }) => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
            setUsername(user.username);
        }
    }, [user]);

    if (!user) {
        return null;
    }

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (username.trim() === '') {
            setError('이름을 입력하세요.');
            return;
        }
        try {
            const updatedUser = await api.put('/user/me', { username: username.trim() });
            onUpdateUser(updatedUser.data);
            Swal.fire('성공', '회원 정보가 수정되었습니다.', 'success');
            setIsEditing(false);
            setError('');
        } catch (err) {
            setError('정보 수정에 실패했습니다. 다시 시도해주세요.');
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

    return (
        <div className="my-info-view">
            <Card>
                <Card.Header as="h2">내 정보</Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleUpdate}>
                        <Form.Group className="mb-3" controlId="formEmail">
                            <Form.Label>이메일</Form.Label>
                            <Form.Control type="email" value={user.email} disabled />
                            <Form.Text className="text-muted">
                                이메일은 변경할 수 없습니다.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formUsername">
                            <Form.Label>이름</Form.Label>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={!isEditing}
                            />
                        </Form.Group>

                        {isEditing ? (
                            <div>
                                <Button variant="primary" type="submit" className="me-2">
                                    저장
                                </Button>
                                <Button variant="secondary" onClick={() => {
                                    setIsEditing(false);
                                    setUsername(user.username);
                                    setError('');
                                }}>
                                    취소
                                </Button>
                            </div>
                        ) : (
                            <Button variant="outline-primary" onClick={() => setIsEditing(true)}>
                                이름 수정
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
