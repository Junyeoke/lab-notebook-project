import React from 'react';
import { useDrop } from 'react-dnd';
import { FiFolder, FiChevronDown, FiChevronRight, FiInbox, FiTag, FiTrash2, FiChevronsRight, FiUsers } from 'react-icons/fi'; // [수정] FiUsers 추가
import NoteCard from './NoteCard';
import LoadingSpinner from './LoadingSpinner';

// NoteCard의 ItemTypes를 가져옵니다. 실제 경로에 맞게 수정해야 할 수 있습니다.
export const ItemTypes = {
    NOTE: 'note',
};

const ProjectDropTarget = ({ project, onClick, className, children, handleNoteDrop }) => {
    const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
        accept: ItemTypes.NOTE,
        drop: (item) => {
            handleNoteDrop(item.id, project?.id || null, item.currentProjectId);
        },
        canDrop: (item) => {
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

const NoteListPanel = (props) => {
    const {
        isProjectsExpanded,
        setIsProjectsExpanded,
        projects,
        selectedProjectId,
        handleProjectSelect,
        handleNoteDrop,
        handleDeleteProject,
        newProjectName,
        setNewProjectName,
        handleCreateProject,
        isLoading,
        entries,
        handleNoteCardClick,
        selectedEntry,
        searchQuery,
        handleSearchChange,
        onShowCollaboratorModal, // [추가]
        currentUsername, // [추가]
    } = props;

    return (
        <div className="note-list-panel">
            <div className="panel-header">
                <h3>노트 탐색</h3>
            </div>
            <div className="sidebar-search">
                <input type="text" placeholder="노트 제목 및 내용 검색..." value={searchQuery} onChange={handleSearchChange} />
            </div>
            <div className="panel-content">
                <div className="collapsible-section">
                    <div className="collapsible-header" onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}>
                        <div className="header-content"><FiFolder /><h4>프로젝트</h4></div>
                        {isProjectsExpanded ? <FiChevronDown /> : <FiChevronRight />}
                    </div>
                    {isProjectsExpanded && (
                        <div className="collapsible-content">
                            <div className={`project-item ${selectedProjectId === 'all' ? 'active' : ''}`} onClick={() => handleProjectSelect('all')}><FiChevronsRight /> <span>전체 노트</span></div>
                            <ProjectDropTarget project={null} className={`project-item ${selectedProjectId === 'uncategorized' ? 'active' : ''}`} onClick={() => handleProjectSelect('uncategorized')} handleNoteDrop={handleNoteDrop}>
                                <FiInbox /> <span>미분류</span>
                            </ProjectDropTarget>
                            {projects.map(project => {
                                // [추가] 협업 프로젝트 여부 확인
                                const isCollaborativeProject = project.owner?.username !== currentUsername || (project.collaborators && project.collaborators.length > 0);

                                return (
                                    <ProjectDropTarget
                                        key={project.id}
                                        project={project}
                                        className={`project-item ${selectedProjectId === project.id ? 'active' : ''}`}
                                        onClick={() => handleProjectSelect(project.id)}
                                        handleNoteDrop={handleNoteDrop}
                                    >
                                        <div className="project-item-details">
                                            <FiTag /> <span>{project.name}</span>
                                            {isCollaborativeProject && (
                                                <FiUsers 
                                                    className="collaborator-icon" 
                                                    onClick={(e) => { e.stopPropagation(); onShowCollaboratorModal(project); }} 
                                                    title="협업자 목록 보기"
                                                />
                                            )}
                                        </div>
                                        <button className="delete-item-btn" title="프로젝트 삭제" onClick={(e) => handleDeleteProject(e, project)}><FiTrash2 /></button>
                                    </ProjectDropTarget>
                                );
                            })}
                            <form className="add-item-form" onSubmit={handleCreateProject}>
                                <input type="text" placeholder="새 프로젝트 추가..." value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
                                <button type="submit">+</button>
                            </form>
                        </div>
                    )}
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
            </div>
        </div>
    );
};

export default NoteListPanel;
