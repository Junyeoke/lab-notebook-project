import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from './api';
import Swal from 'sweetalert2';
import { useAuth } from './AuthContext';
// CKEditor 임포트
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import {
    FiFileText, FiPlus, FiEdit, FiTrash2, FiFile, FiSave,
    FiFolder, FiArchive, FiTag, FiChevronsRight, FiInbox, FiLogOut,
    FiSearch, FiClipboard, FiCopy,
    FiChevronDown, FiChevronRight // 펼침/접힘 아이콘
} from 'react-icons/fi';
import './App.css';

const ENTRY_API_URL = '/entries';
const PROJECT_API_URL = '/projects';
const TEMPLATE_API_URL = '/templates';
const UPLOAD_URL = 'http://localhost:8080/uploads/';

// 디바운스 훅
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


function LabNotebookApp() {
    const { user, logout } = useAuth();

    // --- 상태 변수 ---
    const [entries, setEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('all');
    const [newProjectName, setNewProjectName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [formData, setFormData] = useState({ title: '', content: '', researcher: '', projectId: '' });
    const [currentView, setCurrentView] = useState('welcome');
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    // 섹션 펼침/접힘 상태
    const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
    const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(true);

    // --- 로그아웃 확인 함수 ---
    const handleLogoutConfirm = () => {
        Swal.fire({
            title: '로그아웃 하시겠습니까?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#005a9c',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '로그아웃',
            cancelButtonText: '취소'
        }).then((result) => {
            if (result.isConfirmed) {
                logout();
            }
        });
    };

    // --- 데이터 로딩 useEffect ---
    // 프로젝트 및 템플릿 로딩
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [projectsRes, templatesRes] = await Promise.all([
                    api.get(PROJECT_API_URL),
                    api.get(TEMPLATE_API_URL)
                ]);
                setProjects(projectsRes.data);
                setTemplates(templatesRes.data);
            } catch (error) {
                console.error("초기 데이터 로딩 실패:", error);
            }
        };
        fetchInitialData();
    }, []);
    // 노트 로딩
    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const params = {};
                if (debouncedSearchQuery) params.search = debouncedSearchQuery;
                else params.projectId = selectedProjectId;
                const entriesRes = await api.get(ENTRY_API_URL, { params });
                const sortedEntries = entriesRes.data.sort((a, b) => b.id - a.id);
                setEntries(sortedEntries);
            } catch (error) {
                console.error("노트 로딩 실패:", error);
            }
        };
        fetchEntries();
    }, [debouncedSearchQuery, selectedProjectId]);


    // --- 유틸리티 함수 ---
    const resetForm = () => {
        setFormData({ title: '', content: '', researcher: '', projectId: '' });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
        setIsEditing(false);
    };
    const isImageFile = (filename) => {
        if (!filename) return false;
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
        return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    };
    const getOriginalFileName = (storedFileName) => {
        if (!storedFileName) return '';
        const parts = storedFileName.split('_');
        return parts.length > 1 ? parts.slice(1).join('_') : storedFileName;
    };
    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleString('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            console.error("날짜 포맷팅 오류:", e);
            return 'Invalid Date';
        }
    };

    // --- 이벤트 핸들러 ---
    const handleCreateNewClick = () => {
        resetForm();
        setSelectedEntry(null);
        setIsEditing(false);
        if (selectedProjectId !== 'all' && selectedProjectId !== 'uncategorized') {
            setFormData(prev => ({ ...prev, projectId: selectedProjectId }));
        }
        setCurrentView('form');
    };
    const handleNoteCardClick = (entry) => {
        resetForm();
        setSelectedEntry(entry);
        setCurrentView('read');
    };
    const handleProjectSelect = (projectId) => {
        setSelectedProjectId(projectId);
        setSearchQuery("");
        setCurrentView('welcome');
        setSelectedEntry(null);
    };
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query) {
            setSelectedProjectId('all');
        }
    };
    const handleEditClick = () => {
        if (!selectedEntry) return;
        setFormData({
            title: selectedEntry.title,
            content: selectedEntry.content || '',
            researcher: selectedEntry.researcher,
            projectId: selectedEntry.project ? selectedEntry.project.id : ''
        });
        setIsEditing(true);
        setCurrentView('form');
    };
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name !== 'content') {
            setFormData(prevData => ({ ...prevData, [name]: value }));
        }
    };
    const handleContentChange = (event, editor) => {
        const data = editor.getData();
        setFormData(prevData => ({ ...prevData, content: data }));
    };
    const handleFileChange = (e) => { setSelectedFile(e.target.files[0]); };
    const handleCancelEdit = () => {
        resetForm();
        if (selectedEntry) setCurrentView('read');
        else setCurrentView('welcome');
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const isContentEmpty = !formData.content || formData.content.trim() === '';
        if (!formData.title || isContentEmpty) {
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
            let successMessage = '';
            if (isEditing) {
                response = await api.put(`${ENTRY_API_URL}/${selectedEntry.id}`, formPayload);
                const updatedEntry = response.data;
                setEntries(entries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
                setSelectedEntry(updatedEntry);
                successMessage = '수정 완료!';
            } else {
                response = await api.post(ENTRY_API_URL, formPayload);
                const newEntry = response.data;
                setSearchQuery("");
                setEntries([newEntry, ...entries]);
                setSelectedEntry(newEntry);
                if (newEntry.project) setSelectedProjectId(newEntry.project.id);
                else setSelectedProjectId('uncategorized');
                successMessage = '저장 완료!';
            }
            resetForm();
            setCurrentView('read');
            Swal.fire({ icon: 'success', title: successMessage, showConfirmButton: false, timer: 1500 });
        } catch (error) {
            console.error("데이터 처리 중 오류 발생:", error);
            Swal.fire({ icon: 'error', title: '서버 오류', text: '데이터 처리 중 문제가 발생했습니다.' });
        }
    };
    const handleDelete = async () => {
        if (!selectedEntry) return;
        Swal.fire({
            title: '정말 삭제하시겠습니까?', text: `"${selectedEntry.title}" 노트를 삭제합니다.`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: '삭제', cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`${ENTRY_API_URL}/${selectedEntry.id}`);
                    setEntries(entries.filter(entry => entry.id !== selectedEntry.id));
                    resetForm(); setSelectedEntry(null); setCurrentView('welcome');
                    Swal.fire('삭제 완료!', '노트가 삭제되었습니다.', 'success');
                } catch (error) {
                    console.error("데이터 삭제 중 오류 발생:", error);
                    Swal.fire('오류 발생', '데이터 삭제 중 문제가 발생했습니다.', 'error');
                }
            }
        });
    };
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        try {
            const response = await api.post(PROJECT_API_URL, { name: newProjectName.trim() });
            setProjects([...projects, response.data]);
            setNewProjectName("");
        } catch (error) {
            console.error("프로젝트 생성 오류:", error);
            Swal.fire('오류 발생', '프로젝트 생성에 실패했습니다. (중복된 이름일 수 있습니다)', 'error');
        }
    };
    const handleDeleteProject = (e, project) => {
        e.stopPropagation();
        Swal.fire({
            title: `프로젝트 삭제: ${project.name}`, text: "프로젝트만 삭제되며, 속해있던 노트들은 '미분류'로 이동합니다.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: '삭제', cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`${PROJECT_API_URL}/${project.id}`);
                    setProjects(projects.filter(p => p.id !== project.id));
                    setEntries(entries.map(entry => {
                        if (entry.project && entry.project.id === project.id) return { ...entry, project: null };
                        return entry;
                    }));
                    if (selectedProjectId === project.id) setSelectedProjectId('all');
                    Swal.fire('삭제 완료!', '프로젝트가 삭제되었습니다.', 'success');
                } catch (error) {
                    console.error("프로젝트 삭제 오류:", error);
                    Swal.fire('오류 발생', '프로젝트 삭제에 실패했습니다.', 'error');
                }
            }
        });
    };
    const handleApplyTemplate = (templateId) => {
        const selectedTemplate = templates.find(t => t.id === parseInt(templateId));
        if (selectedTemplate) {
            setFormData(prev => ({ ...prev, content: selectedTemplate.content }));
            Swal.fire({ icon: 'success', title: '템플릿 적용 완료!', showConfirmButton: false, timer: 1000 });
        }
    };
    const handleSaveAsTemplate = async () => {
        const currentContent = formData.content;
        const currentTitle = formData.title;
        if (!currentContent || currentContent.trim() === '') {
            Swal.fire('오류', '빈 노트는 템플릿으로 저장할 수 없습니다.', 'warning'); return;
        }
        const { value: templateName } = await Swal.fire({
            title: '템플릿으로 저장', input: 'text', inputLabel: '템플릿 이름',
            inputValue: currentTitle, inputPlaceholder: '템플릿 이름을 입력하세요',
            showCancelButton: true,
            inputValidator: (value) => { if (!value || value.trim() === '') return '템플릿 이름은 비워둘 수 없습니다!'; }
        });
        if (templateName && templateName.trim() !== '') {
            try {
                const response = await api.post(TEMPLATE_API_URL, { name: templateName.trim(), content: currentContent });
                setTemplates([...templates, response.data]);
                Swal.fire('저장 완료!', '노트가 템플릿으로 저장되었습니다.', 'success');
            } catch (error) {
                console.error("템플릿 저장 실패:", error);
                Swal.fire('오류', '템플릿 저장에 실패했습니다.', 'error');
            }
        }
    };
    const handleDeleteTemplate = (e, template) => {
        e.stopPropagation();
        Swal.fire({
            title: `템플릿 삭제: ${template.name}`, text: "이 작업은 되돌릴 수 없습니다.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: '삭제', cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`${TEMPLATE_API_URL}/${template.id}`);
                    setTemplates(templates.filter(t => t.id !== template.id));
                    Swal.fire('삭제 완료!', '템플릿이 삭제되었습니다.', 'success');
                } catch (error) {
                    console.error("템플릿 삭제 실패:", error);
                    Swal.fire('오류', '템플릿 삭제에 실패했습니다.', 'error');
                }
            }
        });
    };

    // --- JSX 렌더링 ---
    const renderMainContent = () => {
        switch (currentView) {
            case 'read': // 상세 보기
                if (!selectedEntry) return renderWelcomeView();
                return (
                    <div className="detail-view">
                        <div className="detail-header">
                            <h2>{selectedEntry.title}</h2>
                            <div className="detail-buttons">
                                {selectedEntry.project ? (<span className="detail-project-tag"><FiFolder /> {selectedEntry.project.name}</span>) : (<span className="detail-project-tag uncategorized"><FiInbox /> 미분류</span>)}
                                <button onClick={handleEditClick} className="icon-button edit-button" title="수정하기"><FiEdit /></button>
                                <button onClick={handleDelete} className="icon-button delete-button" title="삭제하기"><FiTrash2 /></button>
                            </div>
                        </div>
                        <div className="detail-meta">
                            <span><strong>실험자:</strong> {selectedEntry.researcher || '미기입'}</span>
                            <span><strong>최종 수정일:</strong> {formatDate(selectedEntry.updatedAt)}</span>
                        </div>
                        <div className="detail-content ck-content">
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

            case 'form': // 작성/수정 폼
                return (
                    <form className="form-view" onSubmit={handleSubmit}>
                        <div className="form-header">
                            <h2>{isEditing ? '실험 노트 수정' : '새 실험 노트 작성'}</h2>
                            {!isEditing && templates.length > 0 && (
                                <div className="template-selector">
                                    <FiClipboard />
                                    <select
                                        onChange={(e) => { handleApplyTemplate(e.target.value); e.target.value = ""; }}
                                        value=""
                                    >
                                        <option value="" disabled>템플릿 사용...</option>
                                        {templates.map(template => ( <option key={template.id} value={template.id}>{template.name}</option> ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="form-group"> <label htmlFor="researcher">실험자</label> <input id="researcher" type="text" name="researcher" className="form-input" value={formData.researcher} onChange={handleFormChange} placeholder="이름 (예: 홍길동)" /> </div>
                        <div className="form-group"> <label htmlFor="title">제목</label> <input id="title" type="text" name="title" className="form-input" value={formData.title} onChange={handleFormChange} placeholder="실험 제목 (필수)" required /> </div>
                        <div className="form-group">
                            <label htmlFor="content">실험 내용</label>
                            <CKEditor
                                editor={ ClassicEditor }
                                data={formData.content}
                                onReady={ editor => { /* ... */ } }
                                onChange={ handleContentChange }
                            />
                        </div>
                        <div className="form-group"> <label htmlFor="projectId">프로젝트</label> <select id="projectId" name="projectId" className="form-input" value={formData.projectId} onChange={handleFormChange}> <option value="">-- 미분류 --</option> {projects.map(project => (<option key={project.id} value={project.id}>{project.name}</option>))} </select> </div>
                        <div className="form-group"> <label htmlFor="file">첨부 파일</label> <input id="file" type="file" className="form-file-input" ref={fileInputRef} onChange={handleFileChange} accept="image/*, .pdf, .doc, .docx, .txt, .xls, .xlsx, .ppt, .pptx, .hwp" /> {isEditing && (<small>파일을 변경하려면 새 파일을 선택하세요.</small>)} </div>
                        <div className="form-buttons">
                            <button type="submit" className="form-submit-btn"><FiSave /> {isEditing ? '수정 완료' : '기록 저장'}</button>
                            <button type="button" onClick={handleCancelEdit} className="form-cancel-btn">취소</button>
                            <button type="button" onClick={handleSaveAsTemplate} className="form-template-btn" title="현재 내용을 새 템플릿으로 저장"><FiCopy /> 템플릿으로 저장</button>
                        </div>
                    </form>
                );
            default: // 환영 메시지
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

    // 메인 앱 레이아웃
    return (
        <div className="app-container">
            {/* 헤더 */}
            <header className="app-header">
                <FiFileText /> <h1>LabLog</h1>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem' }}>{user?.username}님</span>
                    <button onClick={handleLogoutConfirm} className="icon-button logout-button" title="로그아웃"> <FiLogOut /> </button>
                </div>
            </header>

            {/* 메인 바디 (2단) */}
            <div className="app-body">
                {/* 왼쪽 사이드바 */}
                <nav className="sidebar">
                    {/* 새 노트 버튼 */}
                    <div className="sidebar-header"> <button className="create-note-btn" onClick={handleCreateNewClick}><FiPlus /> 새 노트 작성</button> </div>

                    {/* 프로젝트 목록 섹션 */}
                    <div className="project-list-section collapsible-section">
                        <div className="collapsible-header" onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}>
                            <div className="header-content"><FiFolder /><h4>프로젝트</h4></div>
                            {isProjectsExpanded ? <FiChevronDown /> : <FiChevronRight />}
                        </div>
                        {isProjectsExpanded && (
                            <div className="collapsible-content">
                                <div className={`project-item ${selectedProjectId === 'all' ? 'active' : ''}`} onClick={() => handleProjectSelect('all')}><FiChevronsRight /> <span>전체 노트</span></div>
                                <div className={`project-item ${selectedProjectId === 'uncategorized' ? 'active' : ''}`} onClick={() => handleProjectSelect('uncategorized')}><FiInbox /> <span>미분류 노트</span></div>
                                {projects.map(project => (
                                    <div key={project.id} className={`project-item ${selectedProjectId === project.id ? 'active' : ''}`} onClick={() => handleProjectSelect(project.id)}>
                                        <FiTag /> <span>{project.name}</span>
                                        <button className="project-delete-btn" title="프로젝트 삭제" onClick={(e) => handleDeleteProject(e, project)}><FiTrash2 /></button>
                                    </div>
                                ))}
                                <form className="add-project-form" onSubmit={handleCreateProject}> <input type="text" placeholder="새 프로젝트 이름..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} /> <button type="submit">+</button> </form>
                            </div>
                        )}
                    </div>

                    {/* 템플릿 목록 섹션 */}
                    <div className="template-list-section collapsible-section">
                        <div className="collapsible-header" onClick={() => setIsTemplatesExpanded(!isTemplatesExpanded)}>
                            <div className="header-content"><FiClipboard /><h4>템플릿</h4></div>
                            {isTemplatesExpanded ? <FiChevronDown /> : <FiChevronRight />}
                        </div>
                        {isTemplatesExpanded && (
                            <div className="collapsible-content">
                                {templates.length > 0 ? (
                                    templates.map(template => (
                                        <div key={template.id} className="template-item">
                                            <span>{template.name}</span>
                                            <button className="template-delete-btn" title="템플릿 삭제" onClick={(e) => handleDeleteTemplate(e, template)}> <FiTrash2 /> </button>
                                        </div>
                                    ))
                                ) : ( <p className="template-list-empty">저장된 템플릿이 없습니다.</p> )}
                            </div>
                        )}
                    </div>

                    {/* 검색창 */}
                    <div className="sidebar-search"> <FiSearch className="search-icon" /> <input type="text" placeholder="노트 제목 및 내용 검색..." value={searchQuery} onChange={handleSearchChange} /> </div>
                    {/* 노트 목록 */}
                    <div className="note-list">
                        {searchQuery && (<div className="search-result-header">'<strong>{debouncedSearchQuery}</strong>' 검색 결과</div>)}
                        {entries.length > 0 ? (
                            entries.map(entry => (
                                <div key={entry.id} className={`note-card ${selectedEntry?.id === entry.id ? 'selected' : ''}`} onClick={() => handleNoteCardClick(entry)}>
                                    <h3>{entry.title}</h3>
                                    <p dangerouslySetInnerHTML={{ __html: entry.content?.replace(/<[^>]+>/g, '').substring(0, 100) + (entry.content && entry.content.length > 100 ? '...' : '') || '내용 없음' }} />
                                    <small>{formatDate(entry.updatedAt)}</small>
                                </div>
                            ))
                        ) : ( <p className="note-list-empty">{searchQuery ? '검색 결과가 없습니다.' : '이 프로젝트에는 노트가 없습니다.'}</p> )}
                    </div>
                </nav>

                {/* 오른쪽 메인 콘텐츠 */}
                <main className="main-content">{renderMainContent()}</main>
            </div>
        </div>
    );
}

export default LabNotebookApp;