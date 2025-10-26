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
    FiSearch,
    FiClipboard, FiCopy // [수정] 템플릿 관련 아이콘 임포트 추가
} from 'react-icons/fi';
import './App.css'; // CKEditor 기본 스타일은 빌드에 포함됨

const ENTRY_API_URL = '/entries';
const PROJECT_API_URL = '/projects';
const TEMPLATE_API_URL = '/templates'; // 템플릿 API URL
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
    const [templates, setTemplates] = useState([]); // 템플릿 목록 상태
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
    // CKEditor는 editorRef가 필수는 아님

    // --- 데이터 로딩 useEffect ---
    // 프로젝트 및 템플릿 로딩 (앱 마운트 시)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [projectsRes, templatesRes] = await Promise.all([
                    api.get(PROJECT_API_URL),
                    api.get(TEMPLATE_API_URL) // 템플릿 데이터 가져오기
                ]);
                setProjects(projectsRes.data);
                setTemplates(templatesRes.data); // 템플릿 상태 설정
            } catch (error) {
                console.error("초기 데이터 로딩 실패:", error);
                // 사용자에게 오류 알림 (선택사항)
                // Swal.fire('Error', 'Failed to load projects or templates.', 'error');
            }
        };
        fetchInitialData();
    }, []); // 빈 배열: 마운트 시 한 번만 실행
    // 노트 로딩 (검색어 또는 프로젝트 필터 변경 시)
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
                // 검색/필터링 실패 알림 (선택사항)
                // Swal.fire('Error', 'Failed to load notes.', 'error');
            }
        };
        fetchEntries();
    }, [debouncedSearchQuery, selectedProjectId]); // 의존성 배열


    // --- 유틸리티 함수 ---
    const resetForm = () => {
        setFormData({ title: '', content: '', researcher: '', projectId: '' });
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
        setIsEditing(false);
        // CKEditor는 data prop 바인딩으로 자동 초기화될 것으로 예상
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
        if (!dateString) return ''; // 날짜가 없을 경우 대비
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
        resetForm(); // 폼 초기화 후 선택
        setSelectedEntry(entry);
        setCurrentView('read');
    };
    const handleProjectSelect = (projectId) => {
        setSelectedProjectId(projectId);
        setSearchQuery(""); // 프로젝트 변경 시 검색어 초기화
        setCurrentView('welcome');
        setSelectedEntry(null);
    };
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query) { // 검색 시작 시 '전체' 프로젝트로 변경
            setSelectedProjectId('all');
        }
    };
    const handleEditClick = () => {
        if (!selectedEntry) return;
        setFormData({
            title: selectedEntry.title,
            content: selectedEntry.content || '', // HTML 또는 빈 문자열
            researcher: selectedEntry.researcher,
            projectId: selectedEntry.project ? selectedEntry.project.id : ''
        });
        setIsEditing(true);
        setCurrentView('form');
    };
    // 폼 입력 변경 (content 제외)
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name !== 'content') {
            setFormData(prevData => ({ ...prevData, [name]: value }));
        }
    };
    // CKEditor 내용 변경 핸들러
    const handleContentChange = (event, editor) => {
        const data = editor.getData();
        setFormData(prevData => ({ ...prevData, content: data }));
    };
    const handleFileChange = (e) => { setSelectedFile(e.target.files[0]); };
    const handleCancelEdit = () => {
        resetForm();
        if (selectedEntry) setCurrentView('read'); // 수정 중 취소면 상세 보기로
        else setCurrentView('welcome'); // 새 글 작성 중 취소면 환영 화면으로
    };
    // 폼 제출 (저장/수정)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const isContentEmpty = !formData.content || formData.content.trim() === ''; // CKEditor 빈 내용 체크
        if (!formData.title || isContentEmpty) {
            Swal.fire({ icon: 'warning', title: '입력 오류', text: '제목과 내용은 필수입니다.' });
            return;
        }
        const { projectId, ...entryData } = formData;
        const formPayload = new FormData();
        formPayload.append("entry", JSON.stringify(entryData)); // content는 HTML
        if (projectId) formPayload.append("projectId", projectId);
        if (selectedFile) formPayload.append("file", selectedFile);

        try {
            let response;
            let successMessage = '';
            if (isEditing) { // 수정
                response = await api.put(`${ENTRY_API_URL}/${selectedEntry.id}`, formPayload);
                const updatedEntry = response.data;
                // entries 목록에서 해당 항목 업데이트
                setEntries(entries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
                setSelectedEntry(updatedEntry); // 현재 보고 있는 상세 내용도 업데이트
                successMessage = '수정 완료!';
            } else { // 생성
                response = await api.post(ENTRY_API_URL, formPayload);
                const newEntry = response.data;
                setSearchQuery(""); // 새 글 작성 후 검색어 초기화
                setEntries([newEntry, ...entries]); // 새 글을 목록 맨 앞에 추가
                setSelectedEntry(newEntry); // 방금 작성한 글로 뷰 전환
                // 새 글이 속한 프로젝트로 이동
                if (newEntry.project) setSelectedProjectId(newEntry.project.id);
                else setSelectedProjectId('uncategorized');
                successMessage = '저장 완료!';
            }
            resetForm();
            setCurrentView('read'); // 상세 보기로 이동
            Swal.fire({ icon: 'success', title: successMessage, showConfirmButton: false, timer: 1500 });
        } catch (error) {
            console.error("데이터 처리 중 오류 발생:", error);
            Swal.fire({ icon: 'error', title: '서버 오류', text: '데이터 처리 중 문제가 발생했습니다.' });
        }
    };
    // 노트 삭제
    const handleDelete = async () => {
        if (!selectedEntry) return;
        Swal.fire({
            title: '정말 삭제하시겠습니까?', text: `"${selectedEntry.title}" 노트를 삭제합니다.`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: '삭제', cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`${ENTRY_API_URL}/${selectedEntry.id}`);
                    setEntries(entries.filter(entry => entry.id !== selectedEntry.id)); // 목록에서 제거
                    resetForm(); setSelectedEntry(null); setCurrentView('welcome'); // 상태 초기화
                    Swal.fire('삭제 완료!', '노트가 삭제되었습니다.', 'success');
                } catch (error) {
                    console.error("데이터 삭제 중 오류 발생:", error);
                    Swal.fire('오류 발생', '데이터 삭제 중 문제가 발생했습니다.', 'error');
                }
            }
        });
    };
    // 새 프로젝트 생성
    const handleCreateProject = async (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        try {
            const response = await api.post(PROJECT_API_URL, { name: newProjectName.trim() });
            setProjects([...projects, response.data]); // 목록에 추가
            setNewProjectName(""); // 입력 필드 초기화
        } catch (error) {
            console.error("프로젝트 생성 오류:", error);
            Swal.fire('오류 발생', '프로젝트 생성에 실패했습니다. (중복된 이름일 수 있습니다)', 'error');
        }
    };
    // 프로젝트 삭제
    const handleDeleteProject = (e, project) => {
        e.stopPropagation();
        Swal.fire({
            title: `프로젝트 삭제: ${project.name}`, text: "프로젝트만 삭제되며, 속해있던 노트들은 '미분류'로 이동합니다.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: '삭제', cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`${PROJECT_API_URL}/${project.id}`);
                    setProjects(projects.filter(p => p.id !== project.id)); // 목록에서 제거
                    // 노트들의 project 필드를 null로 업데이트 (프론트 상태)
                    setEntries(entries.map(entry => {
                        if (entry.project && entry.project.id === project.id) return { ...entry, project: null };
                        return entry;
                    }));
                    // 현재 선택된 프로젝트가 삭제되었다면 '전체'로 이동
                    if (selectedProjectId === project.id) setSelectedProjectId('all');
                    Swal.fire('삭제 완료!', '프로젝트가 삭제되었습니다.', 'success');
                } catch (error) {
                    console.error("프로젝트 삭제 오류:", error);
                    Swal.fire('오류 발생', '프로젝트 삭제에 실패했습니다.', 'error');
                }
            }
        });
    };
    // 템플릿 적용 핸들러
    const handleApplyTemplate = (templateId) => {
        const selectedTemplate = templates.find(t => t.id === parseInt(templateId));
        if (selectedTemplate) {
            setFormData(prev => ({
                ...prev,
                content: selectedTemplate.content // 폼 데이터의 content 업데이트
            }));
            // CKEditor는 data prop 바인딩을 통해 내용이 업데이트될 것임
            Swal.fire({ icon: 'success', title: '템플릿 적용 완료!', showConfirmButton: false, timer: 1000 });
        }
    };
    // 템플릿으로 저장 핸들러
    const handleSaveAsTemplate = async () => {
        const currentContent = formData.content;
        const currentTitle = formData.title;

        if (!currentContent || currentContent.trim() === '') {
            Swal.fire('오류', '빈 노트는 템플릿으로 저장할 수 없습니다.', 'warning');
            return;
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
                setTemplates([...templates, response.data]); // 새 템플릿을 상태에 추가
                Swal.fire('저장 완료!', '노트가 템플릿으로 저장되었습니다.', 'success');
            } catch (error) {
                console.error("템플릿 저장 실패:", error);
                Swal.fire('오류', '템플릿 저장에 실패했습니다.', 'error');
            }
        }
    };
    // 템플릿 삭제 핸들러
    const handleDeleteTemplate = (e, template) => {
        e.stopPropagation();
        Swal.fire({
            title: `템플릿 삭제: ${template.name}`, text: "이 작업은 되돌릴 수 없습니다.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: '삭제', cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`${TEMPLATE_API_URL}/${template.id}`);
                    setTemplates(templates.filter(t => t.id !== template.id)); // 상태에서 제거
                    Swal.fire('삭제 완료!', '템플릿이 삭제되었습니다.', 'success');
                } catch (error) {
                    console.error("템플릿 삭제 실패:", error);
                    Swal.fire('오류', '템플릿 삭제에 실패했습니다.', 'error');
                }
            }
        });
    };

    // --- JSX 렌더링 ---
    // 오른쪽 메인 콘텐츠
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
                        {/* CKEditor 콘텐츠 렌더링 */}
                        <div className="detail-content ck-content">
                            <div dangerouslySetInnerHTML={{ __html: selectedEntry.content || '' }} />
                        </div>
                        {/* 첨부 파일 */}
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
                        {/* 폼 헤더: 제목 + 템플릿 드롭다운 */}
                        <div className="form-header">
                            <h2>{isEditing ? '실험 노트 수정' : '새 실험 노트 작성'}</h2>
                            {/* 새 노트 작성 시에만 템플릿 드롭다운 표시 */}
                            {!isEditing && templates.length > 0 && (
                                <div className="template-selector">
                                    <FiClipboard />
                                    <select
                                        onChange={(e) => {
                                            handleApplyTemplate(e.target.value);
                                            // 선택 후 기본값으로 되돌리기 (옵션)
                                            e.target.value = "";
                                        }}
                                        value="" // 항상 플레이스홀더 표시
                                    >
                                        <option value="" disabled>템플릿 사용...</option>
                                        {templates.map(template => (
                                            <option key={template.id} value={template.id}>
                                                {template.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* 실험자, 제목 입력 필드 */}
                        <div className="form-group"> <label htmlFor="researcher">실험자</label> <input id="researcher" type="text" name="researcher" className="form-input" value={formData.researcher} onChange={handleFormChange} placeholder="이름 (예: 이준혁)" /> </div>
                        <div className="form-group"> <label htmlFor="title">제목</label> <input id="title" type="text" name="title" className="form-input" value={formData.title} onChange={handleFormChange} placeholder="실험 제목 (필수)" required /> </div>

                        {/* CKEditor */}
                        <div className="form-group">
                            <label htmlFor="content">실험 내용</label>
                            <CKEditor
                                editor={ ClassicEditor }
                                data={formData.content} // 상태와 바인딩
                                onReady={ editor => { /* 필요한 경우 에디터 인스턴스 저장 */ } }
                                onChange={ handleContentChange }
                                // config={{ language: 'ko' }}
                            />
                        </div>

                        {/* 프로젝트 선택, 파일 첨부 */}
                        <div className="form-group"> <label htmlFor="projectId">프로젝트</label> <select id="projectId" name="projectId" className="form-input" value={formData.projectId} onChange={handleFormChange}> <option value="">-- 미분류 --</option> {projects.map(project => (<option key={project.id} value={project.id}>{project.name}</option>))} </select> </div>
                        <div className="form-group"> <label htmlFor="file">첨부 파일</label> <input id="file" type="file" className="form-file-input" ref={fileInputRef} onChange={handleFileChange} accept="image/*, .pdf, .doc, .docx, .txt, .xls, .xlsx, .ppt, .pptx, .hwp" /> {isEditing && (<small>파일을 변경하려면 새 파일을 선택하세요.</small>)} </div>

                        {/* 폼 버튼 */}
                        <div className="form-buttons">
                            <button type="submit" className="form-submit-btn"><FiSave /> {isEditing ? '수정 완료' : '기록 저장'}</button>
                            <button type="button" onClick={handleCancelEdit} className="form-cancel-btn">취소</button>
                            {/* 템플릿으로 저장 버튼 */}
                            <button type="button" onClick={handleSaveAsTemplate} className="form-template-btn" title="현재 내용을 새 템플릿으로 저장">
                                <FiCopy /> 템플릿으로 저장
                            </button>
                        </div>
                    </form>
                );
            default: // 환영 메시지
                return renderWelcomeView();
        }
    };
    // 환영 메시지 뷰
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
                <FiFileText /> <h1>나의 실험 노트</h1>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem' }}>{user?.username}님, 환영합니다.</span>
                    <button onClick={logout} className="icon-button delete-button" title="로그아웃" style={{ fontSize: '1.2rem', color: 'white', background: 'var(--color-primary-dark)' }}><FiLogOut /></button>
                </div>
            </header>

            {/* 메인 바디 (2단) */}
            <div className="app-body">
                {/* 왼쪽 사이드바 */}
                <nav className="sidebar">
                    {/* 새 노트 버튼 */}
                    <div className="sidebar-header"> <button className="create-note-btn" onClick={handleCreateNewClick}><FiPlus /> 새 노트 작성</button> </div>
                    {/* 프로젝트 목록 */}
                    <div className="project-list-section">
                        <div className="project-list-header"><FiFolder /><h4>프로젝트</h4></div>
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
                    {/* 템플릿 목록 */}
                    <div className="template-list-section">
                        <div className="template-list-header"><FiClipboard /><h4>템플릿</h4></div>
                        {templates.length > 0 ? (
                            templates.map(template => (
                                <div key={template.id} className="template-item">
                                    <span>{template.name}</span>
                                    <button className="template-delete-btn" title="템플릿 삭제" onClick={(e) => handleDeleteTemplate(e, template)}> <FiTrash2 /> </button>
                                </div>
                            ))
                        ) : ( <p className="template-list-empty">저장된 템플릿이 없습니다.</p> )}
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
                                    {/* HTML 제거 후 요약 표시 (substring 추가 + '...' 추가) */}
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