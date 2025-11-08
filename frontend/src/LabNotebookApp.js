import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from './api';
import Swal from 'sweetalert2';
import { useAuth } from './AuthContext';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import ReactDiffViewer from 'react-diff-viewer';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
    FiFileText, FiPlus, FiEdit, FiTrash2, FiFile, FiSave,
    FiFolder, FiArchive, FiTag, FiChevronsRight, FiInbox, FiLogOut,
    FiSearch, FiClipboard, FiCopy,
    FiChevronDown, FiChevronRight,
    FiInfo, FiDownload, FiClock
} from 'react-icons/fi';
import './App.css';

const ENTRY_API_URL = '/entries';
const PROJECT_API_URL = '/projects';
const TEMPLATE_API_URL = '/templates';
const UPLOAD_URL = 'http://localhost:8080/uploads/';

const ItemTypes = {
    NOTE: 'note',
};

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

// 유틸리티 함수
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

// Base64 -> File 객체 변환 헬퍼
const dataURLtoFile = (dataurl, filename) => {
    if (!dataurl) return null;
    try {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    } catch (e) {
        console.error("dataURLtoFile 변환 오류:", e);
        return null;
    }
}


// NoteCard 컴포넌트 (Drag 기능 포함)
const NoteCard = ({ entry, onClick, isSelected }) => {
    const [{ isDragging }, dragRef] = useDrag(() => ({
        type: ItemTypes.NOTE,
        item: { id: entry.id, currentProjectId: entry.project?.id || null },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const summary = entry.content?.replace(/<[^>]+>/g, '').substring(0, 100) +
        (entry.content && entry.content.length > 100 ? '...' : '') || '내용 없음';

    return (
        <div
            ref={dragRef}
            className={`note-card ${isSelected ? 'selected' : ''}`}
            style={{ opacity: isDragging ? 0.5 : 1 }}
            data-dragging={isDragging}
            onClick={onClick}
        >
            <h3>{entry.title}</h3>
            <p dangerouslySetInnerHTML={{ __html: summary }} />
            <small>{formatDate(entry.updatedAt)}</small>
        </div>
    );
};


const LoadingSpinner = () => (
    <div className="loading-spinner-container">
        <div className="loading-spinner"></div>
    </div>
);

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
        const [formData, setFormData] = useState({ title: '', content: '', researcher: '', projectId: '', tags: '' });
        const [currentView, setCurrentView] = useState('home'); // [수정] 초기 뷰를 'home'으로
        const [selectedEntry, setSelectedEntry] = useState(null);
        const [isEditing, setIsEditing] = useState(false);
        const [selectedFile, setSelectedFile] = useState(null);
        const [versionHistory, setVersionHistory] = useState([]);
        const [showHistory, setShowHistory] = useState(false);
            const [diffWithVersion, setDiffWithVersion] = useState(null); // [추가] Diff 뷰를 위한 상태
            const [isLoading, setIsLoading] = useState(false); // [추가] 로딩 상태
            const [showUserPopover, setShowUserPopover] = useState(false); // [추가] 사용자 정보 팝오버
            const fileInputRef = useRef(null);
            const quillRef = useRef(null);
            const userMenuRef = useRef(null); // [추가] 사용자 메뉴 참조
            const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
            const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(true);
            const isUploadingRef = useRef(false); // 이미지 업로드 중 무한 루프 방지
        
            // [수정] Quill 에디터 이미지 핸들러 (툴바용)
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
        
            // [수정] Quill 모듈 설정 (핸들러 연결)
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
                    handlers: {
                        image: imageHandler,
                    },
                }
            }), []);
        
            const formats = [
                'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
                'list', 'indent', 'link', 'image', 'align', 'color', 'background',
            ];
        
            // [추가] 붙여넣기 된 Base64 이미지를 처리하는 useEffect
            useEffect(() => {
                if (isUploadingRef.current) return; // 업로드 중이면 실행 방지
        
                const handlePastedImages = async () => {
                    const content = formData.content;
                    const images = Array.from(content.matchAll(/<img src="(data:image\/[^;]+;base64[^"]+)">/g));
        
                    if (images.length === 0) return;
        
                    isUploadingRef.current = true; // 업로드 시작
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
                                // 실패 시 해당 이미지는 일단 그대로 둠
                            }
                        }
                    }
        
                    if (newContent !== content) {
                        setFormData(prev => ({ ...prev, content: newContent }));
                    }
        
                    // 짧은 딜레이 후 업로드 상태 해제
                    setTimeout(() => {
                        isUploadingRef.current = false;
                    }, 100);
                };
        
                handlePastedImages();
        
            }, [formData.content]);
        
            // [추가] 외부 클릭 감지 useEffect (사용자 팝오버)
            useEffect(() => {
                const handleClickOutside = (event) => {
                    if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                        setShowUserPopover(false);
                    }
                };
                document.addEventListener("mousedown", handleClickOutside);
                return () => {
                    document.removeEventListener("mousedown", handleClickOutside);
                };
            }, [userMenuRef]);
        
        
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
                    setIsLoading(true); // 로딩 시작
                    try {
                        const params = {};
                        if (debouncedSearchQuery) {
                            params.search = debouncedSearchQuery;
                        } else if (selectedProjectId !== 'home') { // [수정] home 뷰에서는 전체 노트를 가져오도록 함
                            params.projectId = selectedProjectId;
                        } else {
                            params.projectId = 'all';
                        }
        
                        const entriesRes = await api.get(ENTRY_API_URL, { params });
                        const sortedEntries = entriesRes.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                        setEntries(sortedEntries);
                    } catch (error) {
                        console.error("노트 로딩 실패:", error);
                        setEntries([]); // 에러 발생 시 목록 비우기
                    } finally {
                        setIsLoading(false); // 로딩 종료
                    }
                };
                fetchEntries();
            }, [debouncedSearchQuery, selectedProjectId]);
        
        
            // --- 유틸리티 함수 ---
            const resetForm = () => {
                setFormData({ title: '', content: '', researcher: '', projectId: '', tags: '' });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = null;
                setIsEditing(false);
                setShowHistory(false);
                setVersionHistory([]);
                setDiffWithVersion(null); // [추가]
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
        
        
            // --- DND 핸들러 ---
            const handleNoteDrop = async (noteId, targetProjectId, currentProjectId) => {
                const targetId = targetProjectId || null;
                if (targetId === currentProjectId) {
                    return;
                }
                const noteToMove = entries.find(e => e.id === noteId);
                if (!noteToMove) return;
                const originalEntries = entries;
        
                setEntries(prevEntries => prevEntries.filter(entry => entry.id !== noteId));
        
                try {
                    const entryData = {
                        title: noteToMove.title,
                        content: noteToMove.content,
                        researcher: noteToMove.researcher,
                        tags: noteToMove.tags,
                    };
                    const formPayload = new FormData();
                    formPayload.append("entry", JSON.stringify(entryData));
                    if (targetId) {
                        formPayload.append("projectId", targetId);
                    }
                    await api.put(`${ENTRY_API_URL}/${noteId}`, formPayload);
        
                    Swal.fire({ icon: 'success', title: '노트 이동 완료!', showConfirmButton: false, timer: 1000 });
        
                    setSelectedProjectId(targetId || 'uncategorized');
                    setSearchQuery("");
                    setCurrentView('welcome');
                    setSelectedEntry(null);
        
                } catch (error) {
                    console.error("노트 이동 실패:", error);
                    setEntries(originalEntries);
                    Swal.fire('오류', '노트 이동에 실패했습니다.', 'error');
                }
            };
        
        
            // --- ProjectDropTarget 내부 컴포넌트 ---
            const ProjectDropTarget = ({ project, onClick, className, children }) => {
                const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
                    accept: ItemTypes.NOTE,
                    drop: (item, monitor) => {
                        handleNoteDrop(item.id, project?.id || null, item.currentProjectId);
                    },
                    canDrop: (item, monitor) => {
                        return (project?.id || null) !== item.currentProjectId;
                    },
                    collect: (monitor) => ({
                        isOver: !!monitor.isOver(),
                        canDrop: !!monitor.canDrop(),
                    }),
                }), [project, handleNoteDrop]);
        
                return (
                    <div
                        ref={dropRef}
                        className={`${className} ${canDrop ? 'droppable' : ''}`}
                        onClick={onClick}
                        data-hovered={isOver && canDrop}
                    >
                        {children}
                    </div>
                );
            };
        
        
            // --- 나머지 이벤트 핸들러 ---
            const handleCreateNewClick = () => {
                resetForm();
                setSelectedEntry(null);
                setIsEditing(false);
                if (selectedProjectId !== 'all' && selectedProjectId !== 'uncategorized' && selectedProjectId !== 'home') {
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
            const handleGoHome = () => {
                resetForm();
                setSelectedEntry(null);
                setCurrentView('home');
                setSelectedProjectId('home');
                setSearchQuery("");
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
                    projectId: selectedEntry.project ? selectedEntry.project.id : '',
                    tags: selectedEntry.tags ? selectedEntry.tags.join(', ') : ''
                });
                setIsEditing(true);
                setCurrentView('form');
            };
            const handleFormChange = (e) => {
                const { name, value } = e.target;
                setFormData(prevData => ({ ...prevData, [name]: value }));
            };
            const handleContentChange = (content) => {
                // 업로드 중일 때는 Quill의 변경을 바로 반영하지 않음
                if (!isUploadingRef.current) {
                    setFormData(prevData => ({ ...prevData, content: content }));
                }
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
        
                // [수정] 태그 문자열을 배열로 변환
                const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                const { projectId, ...entryData } = { ...formData, tags: tagsArray };
        
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
        
            const handleExportMarkdown = async (entryId, entryTitle) => {
                        try {
                            const response = await api.get(`${ENTRY_API_URL}/${entryId}/export/markdown`, {
                                responseType: 'blob', // [수정] 응답 타입을 blob으로 지정
                            });
                
                            // [수정] Content-Disposition 헤더에서 파일 이름 추출
                            const contentDisposition = response.headers['content-disposition'];
                            let fileName = `${entryTitle.replace(/\s/g, '_') || 'entry'}.md`; // 기본 파일명
                            if (contentDisposition) {
                                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
                                if (fileNameMatch.length === 2)
                                    fileName = fileNameMatch[1];
                            }
                
                            // Blob URL을 생성하여 다운로드 링크로 사용
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', fileName);
                            document.body.appendChild(link);
                            link.click();
                
                            // 다운로드 후 링크와 URL 정리
                            link.parentNode.removeChild(link);
                            window.URL.revokeObjectURL(url);
                
                        } catch (error) {
                            console.error("마크다운 내보내기 실패:", error);
                            Swal.fire('오류', '마크다운 내보내기에 실패했습니다.', 'error');
                        }            };
        
            // [수정] 버전 기록 보기 핸들러
            const handleShowHistory = async () => {
                if (!selectedEntry) return;
                try {
                    const response = await api.get(`${ENTRY_API_URL}/${selectedEntry.id}/versions`);
                    setVersionHistory(response.data);
                    setShowHistory(true);
                    setDiffWithVersion(null); // Diff 뷰 초기화
                } catch (error) {
                    console.error("버전 기록 로딩 실패:", error);
                    Swal.fire('오류', '버전 기록을 불러오는 데 실패했습니다.', 'error');
                }
            };
        
            // [수정] 버전 복원 핸들러
            const handleRestoreVersion = async (versionId) => {
                if (!selectedEntry) return;
        
                Swal.fire({
                    title: '버전을 복원하시겠습니까?',
                    text: "복원 작업은 현재 내용을 덮어쓰지만, 복원 직전의 내용도 새 버전으로 저장됩니다.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#005a9c',
                    confirmButtonText: '복원',
                    cancelButtonText: '취소'
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        try {
                            const response = await api.post(`${ENTRY_API_URL}/${selectedEntry.id}/versions/${versionId}/restore`);
                            const restoredEntry = response.data;
        
                            // UI 업데이트
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
        
        
            // --- JSX 렌더링 ---
            const renderMainContent = () => {
                switch (currentView) {
                    case 'home':
                        return renderHomeView();
                    case 'read': // 상세 보기
                        if (!selectedEntry) return renderWelcomeView();
                        return (
                            <div className="detail-view">
                                <div className="detail-header">
                                    <h2>{selectedEntry.title}</h2>
                                    <div className="detail-buttons">
                                        {selectedEntry.project ? (<span className="detail-project-tag"><FiFolder /> {selectedEntry.project.name}</span>) : (<span className="detail-project-tag uncategorized"><FiInbox /> 미분류</span>)}
                                        <button onClick={handleShowHistory} className="icon-button" title="버전 기록"><FiClock /></button>
                                        <button onClick={() => handleExportMarkdown(selectedEntry.id, selectedEntry.title)} className="icon-button" title="마크다운으로 내보내기"><FiDownload /></button>
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
                                <div className="form-group"> <label htmlFor="tags">태그</label> <input id="tags" type="text" name="tags" className="form-input" value={formData.tags} onChange={handleFormChange} placeholder="쉼표(,)로 태그를 구분하세요 (예: 실험, 데이터, 분석)" /> </div>
                                <div className="form-group">
                                    <label htmlFor="content">실험 내용</label>
                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={formData.content}
                                        onChange={handleContentChange}
                                        modules={modules}
                                        formats={formats}
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
            // 환영 메시지 뷰
            const renderWelcomeView = () => (
                <div className="welcome-view">
                    <FiFileText />
                    <h2>환영합니다!</h2>
                    <p>왼쪽에서 노트를 선택하거나 새 노트를 작성하세요.</p>
                </div>
            );
        
            // [추가] 홈 화면 뷰
            const renderHomeView = () => {
                const recentEntries = entries.slice(0, 5);
                return (
                    <div className="home-view">
                        <h1>안녕하세요, {user?.username}님!</h1>
                        <p>LabLog에 오신 것을 환영합니다. 실험 기록을 시작해보세요.</p>
                        <div className="stats-container">
                            <div className="stat-card">
                                <h2>{entries.length}</h2>
                                <p>총 노트 수</p>
                            </div>
                            <div className="stat-card">
                                <h2>{projects.length}</h2>
                                <p>총 프로젝트 수</p>
                            </div>
                        </div>
                        <div className="quick-actions">
                            <button onClick={handleCreateNewClick}><FiPlus /> 새 노트 작성</button>
                        </div>
                        <div className="recent-notes">
                            <h2>최근 수정된 노트</h2>
                            {recentEntries.length > 0 ? (
                                <ul>
                                    {recentEntries.map(entry => (
                                        <li key={entry.id} onClick={() => handleNoteCardClick(entry)}>
                                            <span>{entry.title}</span>
                                            <small>{formatDate(entry.updatedAt)}</small>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>아직 작성된 노트가 없습니다.</p>
                            )}
                        </div>
                    </div>
                );
            };
        
        
            // [ 7. DndProvider로 앱 감싸기 ]
            return (
                <DndProvider backend={HTML5Backend}>
                    <div className="app-container">
                        {/* 헤더 */}
                        <header className="app-header">
                            <div className="logo" onClick={handleGoHome} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FiFileText />
                                <h1>LabLog</h1>
                            </div>
                            <div ref={userMenuRef} className="user-menu-container">
                                <div className="user-menu-trigger" onClick={() => setShowUserPopover(!showUserPopover)}>
                                    <span>{user?.username}님</span>
                                    <FiChevronDown style={{ transform: showUserPopover ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                </div>
                                {showUserPopover && (
                                    <div className="user-popover">
                                        <div className="user-info">
                                            <strong>{user.username}</strong>
                                            <small>{user.email}</small>
                                            <span className="provider-badge">{user.provider}</span>
                                        </div>
                                        <button onClick={handleLogoutConfirm} className="logout-button">
                                            <FiLogOut />
                                            로그아웃
                                        </button>
                                    </div>
                                )}
                            </div>
                        </header>
        
                        {/* 메인 바디 (2단) */}
                        <div className="app-body">
                            {/* 왼쪽 사이드바 */}
                            <nav className="sidebar">
                                <div className="sidebar-header">
                                    <button className="create-note-btn" onClick={handleCreateNewClick}><FiPlus /> 새 노트 작성</button>
                                </div>
        
                                <div className="sidebar-search">
                                    <FiSearch className="search-icon" />
                                    <input type="text" placeholder="노트 제목 및 내용 검색..." value={searchQuery} onChange={handleSearchChange} />
                                </div>
        
                                <div className="sidebar-scrollable-content">
                                    <div className="collapsible-section">
                                        <div className="collapsible-header" onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}>
                                            <div className="header-content"><FiFolder /><h4>프로젝트</h4></div>
                                            {isProjectsExpanded ? <FiChevronDown /> : <FiChevronRight />}
                                        </div>
                                        {isProjectsExpanded && (
                                            <div className="collapsible-content">
                                                <div className={`project-item ${selectedProjectId === 'all' ? 'active' : ''}`} onClick={() => handleProjectSelect('all')}><FiChevronsRight /> <span>전체 노트</span></div>
                                                <ProjectDropTarget project={null} className={`project-item ${selectedProjectId === 'uncategorized' ? 'active' : ''}`} onClick={() => handleProjectSelect('uncategorized')}>
                                                    <FiInbox /> <span>미분류</span>
                                                </ProjectDropTarget>
                                                {projects.map(project => (
                                                    <ProjectDropTarget
                                                        key={project.id}
                                                        project={project}
                                                        className={`project-item ${selectedProjectId === project.id ? 'active' : ''}`}
                                                        onClick={() => handleProjectSelect(project.id)}
                                                    >
                                                        <FiTag /> <span>{project.name}</span>
                                                        <button className="delete-item-btn" title="프로젝트 삭제" onClick={(e) => handleDeleteProject(e, project)}><FiTrash2 /></button>
                                                    </ProjectDropTarget>
                                                ))}
                                                <form className="add-item-form" onSubmit={handleCreateProject}>
                                                    <input type="text" placeholder="새 프로젝트 추가..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
                                                    <button type="submit">+</button>
                                                </form>
                                            </div>
                                        )}
                                    </div>
        
                                    <div className="collapsible-section">
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
                                                            <button className="delete-item-btn" title="템플릿 삭제" onClick={(e) => handleDeleteTemplate(e, template)}> <FiTrash2 /> </button>
                                                        </div>
                                                    ))
                                                ) : ( <p className="list-empty-message">템플릿이 없습니다.</p> )}
                                            </div>
                                        )}
                                    </div>
                                </div>
        
                                <div className="note-list">
                                    {isLoading ? (
                                        <LoadingSpinner />
                                    ) : entries.length > 0 ? (
                                        entries.map(entry => (
                                            <NoteCard
                                                key={entry.id}
                                                entry={entry}
                                                onClick={() => handleNoteCardClick(entry)}
                                                isSelected={selectedEntry?.id === entry.id}
                                            />
                                        ))
                                    ) : (
                                        <div className="note-list-empty">
                                            {searchQuery ? '검색 결과가 없습니다.' : '노트가 없습니다.'}
                                        </div>
                                    )}
                                </div>
                            </nav>
        
                            {/* 오른쪽 메인 콘텐츠 */}
                            <main className="main-content">
                                {showHistory && (
                                    <div className="history-panel-overlay">
                                        <div className="history-panel">
                                            {diffWithVersion ? (
                                                <>
                                                    <div className="history-panel-header">
                                                        <h2>버전 비교</h2>
                                                        <button onClick={() => setDiffWithVersion(null)} className="back-to-list-btn">← 목록으로</button>
                                                    </div>
                                                    <p><strong>{formatDate(diffWithVersion.versionTimestamp)}</strong> 버전과 현재 버전을 비교합니다.</p>
                                                    <div className="diff-viewer-container">
                                                        <ReactDiffViewer
                                                            oldValue={diffWithVersion.content}
                                                            newValue={selectedEntry.content}
                                                            splitView={true}
                                                            leftTitle={`이전 버전 (${formatDate(diffWithVersion.versionTimestamp)})`}
                                                            rightTitle="현재 버전"
                                                        />
                                                    </div>
                                                    <button onClick={() => handleRestoreVersion(diffWithVersion.id)} className="restore-btn large">이 버전으로 복원</button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="history-panel-header">
                                                        <h2>버전 기록</h2>
                                                        <button onClick={() => setShowHistory(false)} className="close-history-btn">&times;</button>
                                                    </div>
                                                    <ul>
                                                        {versionHistory.length > 0 ? versionHistory.map(version => (
                                                            <li key={version.id}>
                                                                <span>{formatDate(version.versionTimestamp)} by {version.researcher || 'Unknown'}</span>
                                                                <button onClick={() => setDiffWithVersion(version)} className="compare-btn">비교</button>
                                                            </li>
                                                        )) : <li>기록된 버전이 없습니다.</li>}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {renderMainContent()}
                            </main>
                        </div>
                    </div>
                </DndProvider> // DndProvider 닫기
            );
        }
        
        export default LabNotebookApp;
        