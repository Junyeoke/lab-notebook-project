import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api, { addCollaborator } from './api'; // [수정] addCollaborator import
import Swal from 'sweetalert2';
import { useAuth } from './AuthContext';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container, Row, Col, Offcanvas } from 'react-bootstrap';

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import NoteListPanel from './components/NoteListPanel';
import HomeView from './components/HomeView';
import WelcomeView from './components/WelcomeView';
import NoteDetailView from './components/NoteDetailView';
import NoteForm from './components/NoteForm';
import HistoryPanel from './components/HistoryPanel';
import TemplateView from './components/TemplateView';
import SettingsView from './components/SettingsView';
import MyInfoView from './components/MyInfoView';
import { themes } from './themes';

import { dataURLtoFile } from './utils';
import 'react-quill-new/dist/quill.snow.css';
import './App.css';
import './components/HistoryPanel.css';
import './components/TemplateView.css';

const ENTRY_API_URL = '/entries';
const PROJECT_API_URL = '/projects';
const TEMPLATE_API_URL = '/templates';

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
    const { user, logout, loginWithToken } = useAuth();

    const [entries, setEntries] = useState([]);
    const [projects, setProjects] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('all');
    const [newProjectName, setNewProjectName] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [formData, setFormData] = useState({ title: '', content: '', researcher: '', projectId: '', tags: '' });
    const [selectedFile, setSelectedFile] = useState(null); // State to hold the selected file
    const [currentView, setCurrentView] = useState('home');
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [versionHistory, setVersionHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [diffWithVersion, setDiffWithVersion] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showOffcanvas, setShowOffcanvas] = useState(false);
    const [showNoteListPanel, setShowNoteListPanel] = useState(true);
    const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
    const [currentThemeName, setCurrentThemeName] = useState('Default Blue');
    const fileInputRef = useRef(null);
    const quillRef = useRef(null);
    const isUploadingRef = useRef(false);

    const applyTheme = useCallback((theme) => {
        Object.keys(theme.colors).forEach(key => {
            document.documentElement.style.setProperty(key, theme.colors[key]);
        });
        localStorage.setItem('labnote-theme', theme.name);
        setCurrentThemeName(theme.name);
    }, []);

    useEffect(() => {
        const savedThemeName = localStorage.getItem('labnote-theme');
        const savedTheme = themes.find(t => t.name === savedThemeName);
        if (savedTheme) {
            applyTheme(savedTheme);
        }
    }, [applyTheme]);

    const handleCloseOffcanvas = () => setShowOffcanvas(false);
    const handleShowOffcanvas = () => setShowOffcanvas(true);

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                const formData = new FormData();
                formData.append('image', file);
                try {
                    const response = await api.post('/entries/images', formData);
                    const imageUrl = response.data.url;
                    const quill = quillRef.current.getEditor();
                    const range = quill.getSelection(true);
                    quill.insertEmbed(range.index, 'image', imageUrl);
                } catch (error) {
                    console.error('이미지 업로드 실패:', error);
                    Swal.fire('오류', '이미지 업로드에 실패했습니다.', 'error');
                }
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                ['link', 'image'],
                [{ 'align': [] }, { 'color': [] }, { 'background': [] }],
                ['clean']
            ],
            handlers: { image: imageHandler },
        }
    }), []);

    const formats = [
        'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'indent', 'link', 'image', 'align', 'color', 'background',
    ];

    useEffect(() => {
        if (isUploadingRef.current) return;
        const handlePastedImages = async () => {
            const content = formData.content;
            const images = Array.from(content.matchAll(/<img src="(data:image\/[^;]+;base64[^"]+)">/g));
            if (images.length === 0) return;
            isUploadingRef.current = true;
            let newContent = content;
            for (const match of images) {
                const base64Src = match[1];
                const file = dataURLtoFile(base64Src, `pasted-image-${Date.now()}.png`);
                if (file) {
                    const formData = new FormData();
                    formData.append('image', file);
                    try {
                        const response = await api.post('/entries/images', formData);
                        const newUrl = response.data.url;
                        newContent = newContent.replace(base64Src, newUrl);
                    } catch (error) {
                        console.error('붙여넣은 이미지 업로드 실패:', error);
                    }
                }
            }
            if (newContent !== content) {
                setFormData(prev => ({ ...prev, content: newContent }));
            }
            setTimeout(() => { isUploadingRef.current = false; }, 100);
        };
        handlePastedImages();
    }, [formData.content]);

    const handleLogoutConfirm = () => {
        Swal.fire({
            title: '로그아웃 하시겠습니까?', icon: 'question', showCancelButton: true,
            confirmButtonColor: '#3B82F6', cancelButtonColor: '#6B7280',
            confirmButtonText: '로그아웃', cancelButtonText: '취소'
        }).then((result) => {
            if (result.isConfirmed) logout();
        });
    };

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

    useEffect(() => {
        const fetchEntries = async () => {
            setIsLoading(true);
            try {
                const params = {};
                if (debouncedSearchQuery) {
                    params.search = debouncedSearchQuery;
                } else {
                    params.projectId = selectedProjectId;
                }
                const entriesRes = await api.get(ENTRY_API_URL, { params });
                const sortedEntries = entriesRes.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                setEntries(sortedEntries);
            } catch (error) {
                console.error("노트 로딩 실패:", error);
                setEntries([]);
            } finally {
                setIsLoading(false);
            }
        };
        if (currentView === 'projects' || debouncedSearchQuery) {
            fetchEntries();
        }
    }, [debouncedSearchQuery, selectedProjectId, currentView]);

    const resetForm = (keepView = false) => {
        setFormData({ title: '', content: '', researcher: '', projectId: '', tags: '' });
        setSelectedFile(null); // Clear selected file
        if (fileInputRef.current) fileInputRef.current.value = null;
        setIsEditing(false);
        setShowHistory(false);
        setVersionHistory([]);
        setDiffWithVersion(null);
        if (!keepView) {
            setSelectedEntry(null);
        }
    };

    const handleNoteDrop = async (noteId, targetProjectId, currentProjectId) => {
        const targetId = targetProjectId || null;
        if (targetId === currentProjectId) return;
        const noteToMove = entries.find(e => e.id === noteId);
        if (!noteToMove) return;
        const originalEntries = entries;
        setEntries(prevEntries => prevEntries.filter(entry => entry.id !== noteId));
        try {
            const entryData = { title: noteToMove.title, content: noteToMove.content, researcher: noteToMove.researcher, tags: noteToMove.tags };
            const formPayload = new FormData();
            formPayload.append("entry", JSON.stringify(entryData));
            if (targetId) formPayload.append("projectId", targetId);
            await api.put(`${ENTRY_API_URL}/${noteId}`, formPayload);
            Swal.fire({ icon: 'success', title: '노트 이동 완료!', showConfirmButton: false, timer: 1000 });
            setSelectedProjectId(targetId || 'uncategorized');
            setSearchQuery("");
            setSelectedEntry(null);
        } catch (error) {
            console.error("노트 이동 실패:", error);
            setEntries(originalEntries);
            Swal.fire('오류', '노트 이동에 실패했습니다.', 'error');
        }
    };

    const handleNavigate = (view) => {
        setCurrentView(view);
        if (view === 'projects') {
            setShowNoteListPanel(true);
            setSelectedEntry(null);
            resetForm(true);
        } else {
            setShowNoteListPanel(false);
        }
        if (view === 'home' || view === 'settings' || view === 'my-info') {
            setSelectedEntry(null);
            resetForm(true);
        }
        handleCloseOffcanvas();
    };

    const handleNavigateToMyInfo = () => {
        handleNavigate('my-info');
    };

    const handleCreateNewClick = () => {
        resetForm();
        if (selectedProjectId !== 'all' && selectedProjectId !== 'uncategorized') {
            setFormData(prev => ({ ...prev, projectId: selectedProjectId }));
        }
        setCurrentView('form');
        setShowNoteListPanel(true);
        handleCloseOffcanvas();
    };

    const handleNoteCardClick = (entry) => {
        resetForm(true);
        setSelectedEntry(entry);
        setCurrentView('read');
        handleCloseOffcanvas();
    };

    const handleProjectSelect = (projectId) => {
        setSelectedProjectId(projectId);
        setSearchQuery("");
        setSelectedEntry(null);
        setCurrentView('projects');
        handleCloseOffcanvas();
    };

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query) {
            setSelectedProjectId('all');
            setCurrentView('projects');
            setShowNoteListPanel(true);
        }
    };

    const handleEditClick = useCallback(() => {
        if (!selectedEntry) return;
        setFormData({
            title: selectedEntry.title, content: selectedEntry.content || '', researcher: selectedEntry.researcher,
            projectId: selectedEntry.project ? selectedEntry.project.id : '',
            tags: selectedEntry.tags ? selectedEntry.tags.join(', ') : ''
        });
        setIsEditing(true);
        setCurrentView('form');
    }, [selectedEntry]);

    const handleCancelEdit = useCallback(() => {
        resetForm();
        if (selectedEntry) setCurrentView('read');
        else setCurrentView('projects');
    }, [selectedEntry]);

    const handleFormChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    }, []);

    const handleContentChange = useCallback((content) => {
        if (!isUploadingRef.current) {
            setFormData(prevData => ({ ...prevData, content: content }));
        }
    }, []);

    const handleFileChange = useCallback((e) => {
        setSelectedFile(e.target.files[0]);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isContentEmpty = !formData.content || formData.content.trim() === '';
        if (!formData.title || isContentEmpty) {
            Swal.fire({ icon: 'warning', title: '입력 오류', text: '제목과 내용은 필수입니다.' });
            return;
        }
        const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        const { projectId, ...entryData } = { ...formData, tags: tagsArray };
        const formPayload = new FormData();
        formPayload.append("entry", JSON.stringify(entryData));
        if (projectId) formPayload.append("projectId", projectId);
        if (selectedFile) {
            formPayload.append("file", selectedFile);
        }
        try {
            let response;
            if (isEditing) {
                response = await api.put(`${ENTRY_API_URL}/${selectedEntry.id}`, formPayload);
                const updatedEntry = response.data;
                setEntries(entries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
                setSelectedEntry(updatedEntry);
            } else {
                response = await api.post(ENTRY_API_URL, formPayload);
                const newEntry = response.data;
                setEntries(prevEntries => [newEntry, ...prevEntries].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
                setSearchQuery("");
                setSelectedEntry(newEntry);
                if (newEntry.project) {
                    setSelectedProjectId(newEntry.project.id);
                } else {
                    setSelectedProjectId('uncategorized');
                }
            }
            resetForm(true);
            setCurrentView('read');
            Swal.fire({ icon: 'success', title: isEditing ? '수정 완료!' : '저장 완료!', showConfirmButton: false, timer: 1500 });
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
                    resetForm();
                    setCurrentView('projects');
                    Swal.fire('삭제 완료!', '노트가 삭제되었습니다.', 'success');
                } catch (error) {
                    console.error("데이터 삭제 중 오류 발생:", error);
                    Swal.fire('오류 발생', '데이터 삭제 중 문제가 발생했습니다.', 'error');
                }
            }
        });
    };

    const createProject = async (name) => {
        if (!name.trim()) return null;
        try {
            const response = await api.post(PROJECT_API_URL, { name: name.trim() });
            setProjects(prev => [...prev, response.data]);
            return response.data;
        } catch (error) {
            console.error("프로젝트 생성 오류:", error);
            Swal.fire('오류 발생', '프로젝트 생성에 실패했습니다. (중복된 이름일 수 있습니다)', 'error');
            return null;
        }
    };

    const handleCreateProject = async (e) => { // For the sidebar input
        e.preventDefault();
        if (!newProjectName.trim()) return;
        const newProject = await createProject(newProjectName);
        if (newProject) {
            setNewProjectName("");
        }
    };

    const handleCreateNewProjectClick = () => { // For the home screen button
        Swal.fire({
            title: '새 프로젝트 생성',
            input: 'text',
            inputPlaceholder: '프로젝트 이름을 입력하세요',
            showCancelButton: true,
            confirmButtonText: '생성',
            cancelButtonText: '취소',
            inputValidator: (value) => {
                if (!value || value.trim() === '') {
                    return '프로젝트 이름은 비워둘 수 없습니다!';
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value) {
                const newProject = await createProject(result.value);
                if (newProject) {
                    Swal.fire('생성 완료!', `'${newProject.name}' 프로젝트가 생성되었습니다.`, 'success');
                }
            }
        });
    };

    const handleProjectCardClick = (project) => {
        handleProjectSelect(project.id);
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

    const handleSaveTemplate = async (templateData) => {
        const { id, name, content } = templateData;
        if (!name || name.trim() === '') {
             Swal.fire('오류', '템플릿 이름은 비워둘 수 없습니다.', 'warning');
             return;
        }
        try {
            if (id) {
                const response = await api.put(`${TEMPLATE_API_URL}/${id}`, { name: name.trim(), content });
                setTemplates(templates.map(t => t.id === id ? response.data : t));
                Swal.fire('저장 완료!', '템플릿이 수정되었습니다.', 'success');
            } else {
                const response = await api.post(TEMPLATE_API_URL, { name: name.trim(), content });
                setTemplates([...templates, response.data]);
                Swal.fire('저장 완료!', '새 템플릿이 저장되었습니다.', 'success');
            }
        } catch (error) {
            console.error("템플릿 저장 실패:", error);
            Swal.fire('오류', '템플릿 저장에 실패했습니다.', 'error');
        }
    };

    const handleSaveAsTemplate = async () => {
        const { value: templateName } = await Swal.fire({
            title: '현재 노트를 템플릿으로 저장', input: 'text', inputLabel: '템플릿 이름',
            inputValue: formData.title,
            inputPlaceholder: '템플릿 이름을 입력하세요',
            showCancelButton: true,
            inputValidator: (value) => { if (!value || value.trim() === '') return '템플릿 이름은 비워둘 수 없습니다!'; }
        });
        if (templateName) {
            handleSaveTemplate({ name: templateName, content: formData.content });
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

    const handleShowHistory = async () => {
        if (!selectedEntry) return;
        try {
            const response = await api.get(`${ENTRY_API_URL}/${selectedEntry.id}/versions`);
            setVersionHistory(response.data);
            setShowHistory(true);
            setDiffWithVersion(null);
        } catch (error) {
            console.error("버전 기록 로딩 실패:", error);
            Swal.fire('오류', '버전 기록을 불러오는 데 실패했습니다.', 'error');
        }
    };

    const handleRestoreVersion = async (versionId) => {
        if (!selectedEntry) return;
        Swal.fire({
            title: '버전을 복원하시겠습니까?', text: "복원 작업은 현재 내용을 덮어쓰지만, 복원 직전의 내용도 새 버전으로 저장됩니다.",
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#3B82F6', confirmButtonText: '복원', cancelButtonText: '취소'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await api.post(`${ENTRY_API_URL}/${selectedEntry.id}/versions/${versionId}/restore`);
                    const restoredEntry = response.data;
                    setEntries(entries.map(entry => entry.id === restoredEntry.id ? restoredEntry : entry));
                    setSelectedEntry(restoredEntry);
                    setShowHistory(false);
                    setVersionHistory([]);
                    setDiffWithVersion(null);
                    Swal.fire('복원 완료!', '선택한 버전으로 노트가 복원되었습니다.', 'success');
                } catch (error) {
                    console.error("버전 복원 실패:", error);
                    Swal.fire('오류', '버전 복원에 실패했습니다.', 'error');
                }
            }
        });
    };

    // --- [추가] 협업자 추가 핸들러 ---
    const handleAddCollaborator = async (projectId, email) => {
        try {
            const response = await addCollaborator(projectId, email);
            const updatedProject = response.data;

            // 1. 전체 프로젝트 목록 업데이트
            setProjects(prevProjects =>
                prevProjects.map(p => (p.id === updatedProject.id ? updatedProject : p))
            );

            // 2. 현재 선택된 노트의 프로젝트 정보도 업데이트
            if (selectedEntry && selectedEntry.project?.id === updatedProject.id) {
                setSelectedEntry(prevEntry => ({
                    ...prevEntry,
                    project: updatedProject,
                }));
            }
            
            Swal.fire('성공', '협업자가 성공적으로 추가되었습니다.', 'success');

        } catch (error) {
            console.error("협업자 추가 실패:", error);
            let errorMessage = '협업자 추가에 실패했습니다.'; // 기본 메시지
            if (error.response) {
                // 404: 사용자를 찾을 수 없음
                if (error.response.status === 404) {
                    errorMessage = '존재하지 않는 사용자 입니다.';
                } 
                // 다른 상태 코드(400 등)에 대해 서버가 보낸 메시지가 있으면 사용
                else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }
            Swal.fire('오류', errorMessage, 'error');
            throw new Error(errorMessage); // CollaboratorManager에서 에러를 캐치하도록 throw
        }
    };


    const renderMainContent = () => {
        switch (currentView) {
            case 'home':
                return <HomeView 
                           user={user} 
                           entries={entries} 
                           projects={projects} 
                           handleCreateNewClick={handleCreateNewClick} 
                           handleNoteCardClick={handleNoteCardClick}
                           handleCreateNewProjectClick={handleCreateNewProjectClick}
                           handleProjectCardClick={handleProjectCardClick}
                       />;
            case 'read':
                // [수정] NoteDetailView에 props 전달
                return <NoteDetailView 
                           selectedEntry={selectedEntry} 
                           handleShowHistory={handleShowHistory} 
                           handleEditClick={handleEditClick} 
                           handleDelete={handleDelete}
                           onAddCollaborator={handleAddCollaborator}
                           onRemoveCollaborator={() => { console.log("Remove collaborator clicked (not implemented yet)")}}
                           currentUsername={user?.username}
                       />;
            case 'form':
                return <NoteForm
                    formData={formData}
                    handleFormChange={handleFormChange}
                    handleContentChange={handleContentChange}
                    handleSubmit={handleSubmit}
                    handleCancelEdit={handleCancelEdit}
                    handleSaveAsTemplate={handleSaveAsTemplate}
                    isEditing={isEditing}
                    templates={templates}
                    handleApplyTemplate={handleApplyTemplate}
                    projects={projects}
                    quillRef={quillRef}
                    modules={modules}
                    formats={formats}
                    fileInputRef={fileInputRef}
                    handleFileChange={handleFileChange} // Pass the new handler
                />;
            case 'templates':
                return <TemplateView 
                           templates={templates} 
                           onSaveTemplate={handleSaveTemplate} 
                           onDeleteTemplate={handleDeleteTemplate}
                           modules={modules}
                           formats={formats}
                       />;
            case 'settings':
                return <SettingsView applyTheme={applyTheme} currentThemeName={currentThemeName} />;
            case 'my-info':
                return <MyInfoView user={user} onUpdateUser={loginWithToken} onAccountDeleted={logout} />;
            case 'projects':
                return <WelcomeView />; // This view is now handled by NoteListPanel
            default:
                return <WelcomeView />;
        }
    };

    const noteListPanelProps = {
        isProjectsExpanded, setIsProjectsExpanded, projects, selectedProjectId, handleProjectSelect,
        handleNoteDrop, handleDeleteProject, newProjectName, setNewProjectName, handleCreateProject,
        isLoading, entries, handleNoteCardClick, selectedEntry, searchQuery, handleSearchChange,
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="app-container">
                <Header user={user} onGoHome={() => handleNavigate('home')} onShowOffcanvas={handleShowOffcanvas} onLogout={handleLogoutConfirm} onNavigateToMyInfo={handleNavigateToMyInfo} />
                <div className="app-body">
                    <Container fluid>
                        <Row>
                            <Col xs="auto" className="main-nav-col d-none d-lg-block">
                                <Sidebar currentView={currentView} onNavigate={handleNavigate} handleCreateNewClick={handleCreateNewClick} />
                            </Col>
                            {showNoteListPanel && (
                                <Col xs="auto" className="note-list-panel-col d-none d-lg-block">
                                    <NoteListPanel {...noteListPanelProps} />
                                </Col>
                            )}
                            <Col className="main-content-col">
                                <main className="main-content">
                                    <HistoryPanel showHistory={showHistory} diffWithVersion={diffWithVersion} setDiffWithVersion={setDiffWithVersion} setShowHistory={setShowHistory} selectedEntry={selectedEntry} versionHistory={versionHistory} handleRestoreVersion={handleRestoreVersion} />
                                    {renderMainContent()}
                                </main>
                            </Col>
                        </Row>
                    </Container>
                </div>
                <Offcanvas show={showOffcanvas} onHide={handleCloseOffcanvas} placement="start">
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title>LogLy</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        <Sidebar currentView={currentView} onNavigate={handleNavigate} handleCreateNewClick={handleCreateNewClick} />
                        <hr/>
                        <NoteListPanel {...noteListPanelProps} />
                    </Offcanvas.Body>
                </Offcanvas>
            </div>
        </DndProvider>
    );
}

export default LabNotebookApp;