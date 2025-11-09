import React from 'react';
import {
    FiFolder, FiInbox, FiClock, FiDownload, FiEdit, FiTrash2, FiFile
} from 'react-icons/fi';
import { formatDate, isImageFile, getOriginalFileName } from '../utils';

const UPLOAD_URL = 'http://localhost:8080/uploads/';

const NoteDetailView = ({ selectedEntry, handleShowHistory, handleExportMarkdown, handleEditClick, handleDelete }) => {
    if (!selectedEntry) {
        return null; // Or a placeholder
    }

    return (
        <div className="detail-view">
            <div className="detail-header">
                <h2>{selectedEntry.title}</h2>
                <div className="detail-buttons">
                    {selectedEntry.project ? (<span className="detail-project-tag"><FiFolder /> {selectedEntry.project.name}</span>) : (<span className="detail-project-tag uncategorized"><FiInbox /> 미분류</span>)}
                    <button onClick={handleShowHistory} className="icon-button" title="버전 기록"><FiClock /></button>
                    <button onClick={handleEditClick} className="icon-button edit-button" title="수정하기"><FiEdit /></button>
                    <button onClick={handleDelete} className="icon-button delete-button" title="삭제하기"><FiTrash2 /></button>
                </div>
            </div>
            <div className="detail-meta">
                <span><strong>실험자:</strong> {selectedEntry.researcher || '미기입'}</span>
                <span><strong>최종 수정일:</strong> {formatDate(selectedEntry.updatedAt)}</span>
            </div>
            {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="tag-list">
                    {selectedEntry.tags.map((tag, index) => (
                        <span key={index} className="tag-badge">{tag}</span>
                    ))}
                </div>
            )}
            <div className="detail-content">
                <div dangerouslySetInnerHTML={{ __html: selectedEntry.content || '' }} />
            </div>
            {selectedEntry.attachedFilePath && (
                <div className="detail-attachment">
                    <h4>첨부 파일</h4>
                    {isImageFile(selectedEntry.attachedFilePath) ? (<img src={UPLOAD_URL + selectedEntry.attachedFilePath} alt="첨부 이미지" className="attached-image" />) : (<div className="attached-document"><a href={UPLOAD_URL + selectedEntry.attachedFilePath} target="_blank" rel="noopener noreferrer" download><FiFile /> {getOriginalFileName(selectedEntry.attachedFilePath)}</a></div>)}
                </div>
            )}
        </div>
    );
};

export default NoteDetailView;
