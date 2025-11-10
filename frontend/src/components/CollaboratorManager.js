import React, { useState } from 'react';
import { FiUser, FiUserPlus, FiAward, FiX } from 'react-icons/fi';
import './CollaboratorManager.css';

const CollaboratorManager = ({ project, onAddCollaborator, onRemoveCollaborator, currentUsername }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!project) {
        return null;
    }

    const { owner, collaborators } = project;

    const handleAddClick = async () => {
        if (!email) {
            setError('이메일을 입력해주세요.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await onAddCollaborator(project.id, email);
            setEmail(''); // 성공 시 입력 필드 초기화
        } catch (err) {
            setError(err.message || '협업자 추가에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // 현재 사용자가 프로젝트 소유자인지 확인
    const isOwner = owner?.username === currentUsername;

    return (
        <div className="collaborator-manager">
            <h4><FiUser /> 프로젝트 협업자</h4>
            <div className="collaborator-list">
                <div className="collaborator-item owner">
                    <FiAward className="owner-icon" />
                    <span>{owner?.username} (소유자)</span>
                </div>
                {collaborators?.map(user => (
                    <div key={user.id} className="collaborator-item">
                        <FiUser />
                        <span>{user.username}</span>
                        {isOwner && (
                             <button 
                                onClick={() => onRemoveCollaborator(project.id, user.id)} 
                                className="remove-btn"
                                title="내보내기"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            
            {isOwner && (
                <div className="add-collaborator-form">
                    <h5><FiUserPlus /> 협업자 초대</h5>
                    <div className="input-group">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="초대할 사용자의 이메일"
                            disabled={isLoading}
                        />
                        <button onClick={handleAddClick} disabled={isLoading}>
                            {isLoading ? '추가 중...' : '추가'}
                        </button>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                </div>
            )}
        </div>
    );
};

export default CollaboratorManager;
