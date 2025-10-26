import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from './api';
import Swal from 'sweetalert2';
import { useAuth } from './AuthContext';
import {
    FiFileText, FiPlus, FiEdit, FiTrash2, FiFile, FiSave,
    FiFolder, FiArchive, FiTag, FiChevronsRight, FiInbox, FiLogOut,
    FiSearch
} from 'react-icons/fi';
import './App.css';

const ENTRY_API_URL = '/entries';
const PROJECT_API_URL = '/projects';
const UPLOAD_URL = 'http://localhost:8080/uploads/';

// 디바운스(Debounce) 훅
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}


function LabNotebookApp() {
    const { user, logout } = useAuth();

    // --- 상태 변수 ---
    const [entries, setEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('all');

    // 1. [수정] 빠뜨렸던 '새 프로젝트 이름' 상태 변수 선언
    const [newProjectName, setNewProjectName] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // (폼, 뷰, 파일 상태는 동일)
    const [formData, setFormData] = useState({ title: '', content: '', researcher: '', projectId: '' });
    const [currentView, setCurrentView] = useState('welcome');
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // --- 데이터 로딩 (useEffect) ---

    // (1) 프로젝트 로딩 (동일)
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const projectsRes = await api.get(PROJECT_API_URL);
                setProjects(projectsRes.data);
            } catch (error) {
                console.error("프로젝트 로딩 실패:", error);
            }
        };
        fetchProjects();
    }, []);

    // (2) 노트 로딩 (동일)
    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const params = {};

                if (debouncedSearchQuery) {
                    params.search = debouncedSearchQuery;
                } else {
                    params.projectId = selectedProjectId;
                }

                const entriesRes = await api.get(ENTRY_API_URL, { params });
                const sortedEntries = entriesRes.data.sort((a, b) => b.id - a.id);
                setEntries(sortedEntries);
            } catch (error) {
                console.error("노트 로딩 실패:", error);
            }
        };
        fetchEntries();
    }, [debouncedSearchQuery, selectedProjectId]);


    // --- 유틸리티 함수 (동일) ---
    const resetForm = () => { /* ... (기존과 동일) ... */
        setFormData({ title: '', content: '', researcher: '', projectId: '' });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
        setIsEditing(false);
    };
    const isImageFile = (filename) => { /* ... (기존과 동일) ... */
        if (!filename) return false;
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
        return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };
    const getOriginalFileName = (storedFileName) => { /* ... (기존과 동일) ... */
        if (!storedFileName) return '';
        const parts = storedFileName.split('_');
        return parts.length > 1 ? parts.slice(1).join('_') : storedFileName;
    };
    const formatDate = (dateString) => { /* ... (기존과 동일) ... */
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // --- 이벤트 핸들러 (동일) ---
    const handleCreateNewClick = () => { /* ... (기존과 동일) ... */
        resetForm();
        setSelectedEntry(null);
        setIsEditing(false);
        if (selectedProjectId !== 'all' && selectedProjectId !== 'uncategorized') {
            setFormData(prev => ({ ...prev, projectId: selectedProjectId }));
        }
        setCurrentView('form');
    };
    const handleNoteCardClick = (entry) => { /* ... (기존과 동일) ... */
        resetForm();
        setSelectedEntry(entry);
        setCurrentView('read');
    };
    const handleProjectSelect = (projectId) => { /* ... (기존과 동일) ... */
        setSelectedProjectId(projectId);
        setSearchQuery("");
        setCurrentView('welcome');
        setSelectedEntry(null);
    };
    const handleSearchChange = (e) => { /* ... (기존과 동일) ... */
        const query = e.target.value;
        setSearchQuery(query);
        if (query) {
            setSelectedProjectId('all');
        }
    };
    const handleEditClick = () => { /* ... (기존과 동일) ... */
        if (!selectedEntry) return;
        setFormData({
            title: selectedEntry.title,
            content: selectedEntry.content,
            researcher: selectedEntry.researcher,
            projectId: selectedEntry.project ? selectedEntry.project.id : ''
        });
        setIsEditing(true);
        setCurrentView('form');
    };
    const handleFormChange = (e) => { /* ... (기존과 동일) ... */
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };
    const handleFileChange = (e) => { /* ... (기존과 동일) ... */
        setSelectedFile(e.target.files[0]);
    };
    const handleCancelEdit = () => { /* ... (기존과 동일) ... */
        resetForm();
        if (selectedEntry) {
            setCurrentView('read');
        } else {
            setCurrentView('welcome');
        }
    };
    const handleSubmit = async (e) => { /* ... (기존과 동일) ... */
        e.preventDefault();
        if (!formData.title || !formData.content) {
            Swal.fire({ icon: 'warning', title: '입력 오류', text: '제목과 내용은 필수입니다.' });
            return;
        }
        const { projectId, ...entryData } = formData;
        const formPayload = new FormData();
        formPayload.append("entry", JSON.stringify(entryData));
        if (projectId) formPayload.append("projectId", projectId);
        if (selectedFile) formPayload.append("file", selectedFile);
        try {
            let response;
            if (isEditing) {
                response = await api.put(`${ENTRY_API_URL}/${selectedEntry.id}`, formPayload);
                const updatedEntry = response.data;
                setEntries(entries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
                setSelectedEntry(updatedEntry);
                Swal.fire({ icon: 'success', title: '수정 완료!', showConfirmButton: false, timer: 1500 });
            } else {
                response = await api.post(ENTRY_API_URL, formPayload);
                const newEntry = response.data;
                setSearchQuery("");
                setEntries([newEntry, ...entries]);
                setSelectedEntry(newEntry);
                if (newEntry.project) {
                    setSelectedProjectId(newEntry.project.id);
                } else {
                    setSelectedProjectId('uncategorized');
                }
                Swal.fire({ icon: 'success', title: '저장 완료!', showConfirmButton: false, timer: 1500 });
            }
            resetForm();
            setCurrentView('read');
        } catch (error) {
            console.error("데이터 처리 중 오류 발생:", error);
            Swal.fire({ icon: 'error', title: '서버 오류', text: '데이터 처리 중 문제가 발생했습니다.' });
        }
    };
    const handleDelete = async () => { /* ... (기존과 동일) ... */
        if (!selectedEntry) return;
        Swal.fire({
            title: '정말 삭제하시겠습니까?',
            text: `"${selectedEntry.title}" 노트를 삭제합니다.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`${ENTRY_API_URL}/${selectedEntry.id}`);
                    setEntries(entries.filter(entry => entry.id !== selectedEntry.id));
                    resetForm();
                    setSelectedEntry(null);
                    setCurrentView('welcome');
                    Swal.fire('삭제 완료!', '노트가 삭제되었습니다.', 'success');
                } catch (error) {
                    console.error("데이터 삭제 중 오류 발생:", error);
                    Swal.fire('오류 발생', '데이터 삭제 중 문제가 발생했습니다.', 'error');
                }
            }
        });
    };

    // [2. 수정] 이제 newProjectName과 setNewProjectName이 정의되었습니다.
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        try {
            const response = await api.post(PROJECT_API_URL, { name: newProjectName.trim() });
            setProjects([...projects, response.data]);
            setNewProjectName(""); // 초기화
        } catch (error) {
            console.error("프로젝트 생성 오류:", error);
            Swal.fire('오류 발생', '프로젝트 생성에 실패했습니다. (중복된 이름일 수 있습니다)', 'error');
        }
    };

    const handleDeleteProject = (e, project) => { /* ... (기존과 동일) ... */
        e.stopPropagation();
        Swal.fire({
            title: `프로젝트 삭제: ${project.name}`,
            text: "프로젝트만 삭제되며, 속해있던 노트들은 '미분류'로 이동합니다.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`${PROJECT_API_URL}/${project.id}`);
                    setProjects(projects.filter(p => p.id !== project.id));
                    setEntries(entries.map(entry => {
                        if (entry.project && entry.project.id === project.id) {
                            return { ...entry, project: null };
                        }
                        return entry;
                    }));
                    if (selectedProjectId === project.id) {
                        setSelectedProjectId('all');
                    }
                    Swal.fire('삭제 완료!', '프로젝트가 삭제되었습니다.', 'success');
                } catch (error) {
                    console.error("프로젝트 삭제 오류:", error);
                    Swal.fire('오류 발생', '프로젝트 삭제에 실패했습니다.', 'error');
                }
            }
        });
    };


    // --- 6. JSX 렌더링 (동일) ---

    // (renderMainContent, renderWelcomeView - 동일)
    const renderMainContent = () => { /* ... (기존과 동일) ... */
        switch (currentView) {
            case 'read':
                if (!selectedEntry) return renderWelcomeView();
                return (
                    <div className="detail-view">
                        <div className="detail-header">
                            <h2>{selectedEntry.title}</h2>
                            <div className="detail-buttons">
                                {selectedEntry.project ? (
                                    <span className="detail-project-tag"><FiFolder /> {selectedEntry.project.name}</span>
                                ) : (
                                    <span className="detail-project-tag uncategorized"><FiInbox /> 미분류</span>
                                )}
                                <button onClick={handleEditClick} className="icon-button edit-button" title="수정하기"><FiEdit /></button>
                                <button onClick={handleDelete} className="icon-button delete-button" title="삭제하기"><FiTrash2 /></button>
                            </div>
                        </div>
                        <div className="detail-meta">
                            <span><strong>실험자:</strong> {selectedEntry.researcher || '미기입'}</span>
                            <span><strong>최종 수정일:</strong> {formatDate(selectedEntry.updatedAt)}</span>
                        </div>
                        <div className="detail-content"><p>{selectedEntry.content}</p></div>
                        {selectedEntry.attachedFilePath && (
                            <div className="detail-attachment">
                                <h4>첨부 파일</h4>
                                {isImageFile(selectedEntry.attachedFilePath) ? (
                                    <img src={UPLOAD_URL + selectedEntry.attachedFilePath} alt="첨부 이미지" className="attached-image" />
                                ) : (
                                    <div className="attached-document">
                                        <a href={UPLOAD_URL + selectedEntry.attachedFilePath} target="_blank" rel="noopener noreferrer" download>
                                            <FiFile /> {getOriginalFileName(selectedEntry.attachedFilePath)}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            case 'form':
                return (
                    <form className="form-view" onSubmit={handleSubmit}>
                        <h2>{isEditing ? '실험 노트 수정' : '새 실험 노트 작성'}</h2>
                        <div className="form-group">
                            <label htmlFor="researcher">실험자</label>
                            <input id="researcher" type="text" name="researcher" className="form-input"
                                   value={formData.researcher} onChange={handleFormChange} placeholder="이름 (예: 이준혁)" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="title">제목</label>
                            <input id="title" type="text" name="title" className="form-input"
                                   value={formData.title} onChange={handleFormChange} placeholder="실험 제목 (필수)" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="content">실험 내용</label>
                            <textarea id="content" name="content" className="form-textarea"
                                      value={formData.content} onChange={handleFormChange} placeholder="실험 과정 및 결과 (필수)" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="projectId">프로젝트</label>
                            <select id="projectId" name="projectId" className="form-input"
                                    value={formData.projectId} onChange={handleFormChange}
                            >
                                <option value="">-- 미분류 --</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="file">첨부 파일</label>
                            <input id="file" type="file" className="form-file-input" ref={fileInputRef}
                                   onChange={handleFileChange} accept="image/*, .pdf, .doc, .docx, .txt, .xls, .xlsx, .ppt, .pptx, .hwp" />
                            {isEditing && (<small>파일을 변경하려면 새 파일을 선택하세요.</small>)}
                        </div>
                        <div className="form-buttons">
                            <button type="submit" className="form-submit-btn"><FiSave /> {isEditing ? '수정 완료' : '기록 저장'}</button>
                            <button type="button" onClick={handleCancelEdit} className="form-cancel-btn">취소</button>
                        </div>
                    </form>
                );
            default:
                return renderWelcomeView();
        }
    };
    const renderWelcomeView = () => (
        <div className="welcome-view">
            <FiFileText />
            <h2>환영합니다!</h2>
            <p>왼쪽에서 노트를 선택하거나 새 노트를 작성하세요.</p>
        </div>
    );


    // (메인 앱 렌더링 - 동일)
    return (
        <div className="app-container">
            {/* 1. 상단 헤더 (동일) */}
            <header className="app-header">
                <FiFileText />
                <h1>나의 실험 노트</h1>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem' }}>{user?.username}님, 환영합니다.</span>
                    <button onClick={logout} className="icon-button delete-button" title="로그아웃"
                            style={{ fontSize: '1.2rem', color: 'white', background: 'var(--color-primary-dark)' }}>
                        <FiLogOut />
                    </button>
                </div>
            </header>

            {/* 2. 메인 2단 바디 */}
            <div className="app-body">

                {/* 2-1. 왼쪽 사이드바 */}
                <nav className="sidebar">
                    {/* (새 노트 버튼) */}
                    <div className="sidebar-header">
                        <button className="create-note-btn" onClick={handleCreateNewClick}>
                            <FiPlus /> 새 노트 작성
                        </button>
                    </div>

                    {/* (프로젝트 목록 섹션) */}
                    <div className="project-list-section">
                        <div className="project-list-header">
                            <FiFolder />
                            <h4>프로젝트</h4>
                        </div>
                        <div className={`project-item ${selectedProjectId === 'all' ? 'active' : ''}`}
                             onClick={() => handleProjectSelect('all')}>
                            <FiChevronsRight /> <span>전체 노트</span>
                        </div>
                        <div className={`project-item ${selectedProjectId === 'uncategorized' ? 'active' : ''}`}
                             onClick={() => handleProjectSelect('uncategorized')}>
                            <FiInbox /> <span>미분류 노트</span>
                        </div>
                        {projects.map(project => (
                            <div key={project.id}
                                 className={`project-item ${selectedProjectId === project.id ? 'active' : ''}`}
                                 onClick={() => handleProjectSelect(project.id)}>
                                <FiTag /> <span>{project.name}</span>
                                <button className="project-delete-btn" title="프로젝트 삭제"
                                        onClick={(e) => handleDeleteProject(e, project)}>
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}

                        {/* [3. 수정] 이제 newProjectName과 setNewProjectName이 정의되었습니다. */}
                        <form className="add-project-form" onSubmit={handleCreateProject}>
                            <input
                                type="text"
                                placeholder="새 프로젝트 이름..."
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                            />
                            <button type="submit">+</button>
                        </form>
                    </div>

                    {/* (검색창 섹션 - 동일) */}
                    <div className="sidebar-search">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="노트 제목 및 내용 검색..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* (노트 목록 - 동일) */}
                    <div className="note-list">
                        {searchQuery && (
                            <div className="search-result-header">
                                '<strong>{debouncedSearchQuery}</strong>' 검색 결과
                            </div>
                        )}

                        {entries.length > 0 ? (
                            entries.map(entry => (
                                <div
                                    key={entry.id}
                                    className={`note-card ${selectedEntry?.id === entry.id ? 'selected' : ''}`}
                                    onClick={() => handleNoteCardClick(entry)}
                                >
                                    <h3>{entry.title}</h3>
                                    <p>{entry.content || '내용 없음'}</p>
                                    <small>{formatDate(entry.updatedAt)}</small>
                                </div>
                            ))
                        ) : (
                            <p className="note-list-empty">
                                {searchQuery ? '검색 결과가 없습니다.' : '이 프로젝트에는 노트가 없습니다.'}
                            </p>
                        )}
                    </div>
                </nav>

                {/* 2-2. 오른쪽 메인 콘텐츠 (동일) */}
                <main className="main-content">
                    {renderMainContent()}
                </main>

            </div>
        </div>
    );
}

export default LabNotebookApp;