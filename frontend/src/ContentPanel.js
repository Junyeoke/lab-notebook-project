import React from 'react';
import { FiFolder, FiInbox, FiTag, FiChevronsRight, FiClipboard, FiTrash2, FiPlus, FiSearch, FiHome } from 'react-icons/fi';
import './ContentPanel.css';

// Re-using these components from LabNotebookApp by passing props
const ProjectDropTarget = ({ project, onClick, className, children }) => (
    <div className={className} onClick={onClick}>
        {children}
    </div>
);

const ContentPanel = (props) => {
    const {
        mainNavView,
        // Project props
        projects,
        selectedProjectId,
        handleProjectSelect,
        handleGoHome,
        handleDeleteProject,
        newProjectName,
        setNewProjectName,
        handleCreateProject,
        isProjectsExpanded,
        setIsProjectsExpanded,
        // Template props
        templates,
        handleDeleteTemplate,
        isTemplatesExpanded,
        setIsTemplatesExpanded,
        // Search props
        searchQuery,
        handleSearchChange,
        // Note list props
        entries,
        handleNoteCardClick,
        selectedEntry,
        isLoading,
        // New Note Button
        handleCreateNewClick,
    } = props;

    const renderProjectsView = () => (
        <>
            <div className="content-panel-header">
                <h2>Projects</h2>
            </div>
            <div className="content-panel-body">
                <div className="sidebar-header">
                    <button className="create-note-btn" onClick={handleCreateNewClick}><FiPlus /> 새 노트 작성</button>
                </div>
                <div className="collapsible-section">
                    <div className="collapsible-header" onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}>
                        <div className="header-content"><FiFolder /><h4>프로젝트</h4></div>
                    </div>
                    {isProjectsExpanded && (
                        <div className="collapsible-content">
                            <div className={`project-item ${selectedProjectId === 'home' ? 'active' : ''}`} onClick={handleGoHome}><FiHome /> <span>홈</span></div>
                            <div className={`project-item ${selectedProjectId === 'uncategorized' ? 'active' : ''}`} onClick={() => handleProjectSelect('uncategorized')}><FiInbox /> <span>미분류</span></div>
                            {projects.map(project => (
                                <div key={project.id} className={`project-item ${selectedProjectId === project.id ? 'active' : ''}`} onClick={() => handleProjectSelect(project.id)}>
                                    <FiTag /> <span>{project.name}</span>
                                    <button className="delete-item-btn" title="프로젝트 삭제" onClick={(e) => handleDeleteProject(e, project)}><FiTrash2 /></button>
                                </div>
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
        </>
    );

    const renderSearchView = () => (
        <>
            <div className="content-panel-header">
                <h2>Search</h2>
            </div>
            <div className="content-panel-body">
                <div className="sidebar-search">
                    <FiSearch className="search-icon" />
                    <input type="text" placeholder="노트 제목 및 내용 검색..." value={searchQuery} onChange={handleSearchChange} autoFocus />
                </div>
                <div className="note-list">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : entries.length > 0 ? (
                        entries.map(entry => (
                            <div key={entry.id} className={`note-card ${selectedEntry?.id === entry.id ? 'active' : ''}`} onClick={() => handleNoteCardClick(entry)}>
                                <h3 className="note-card-title">{entry.title}</h3>
                                <p className="note-card-meta">{(new Date(entry.updatedAt)).toLocaleDateString()}</p>
                            </div>
                        ))
                    ) : (
                        <div className="note-list-empty">
                            {searchQuery ? '검색 결과가 없습니다.' : '검색어를 입력하세요.'}
                        </div>
                    )}
                </div>
            </div>
        </>
    );


    switch (mainNavView) {
        case 'projects':
            return <div className="content-panel">{renderProjectsView()}</div>;
        case 'search':
            return <div className="content-panel">{renderSearchView()}</div>;
        case 'home':
        case 'settings':
        default:
            return null; // Or a placeholder
    }
};

export default ContentPanel;
