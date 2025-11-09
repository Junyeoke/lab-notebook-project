import React from 'react';
import { FiPlus, FiFolder, FiFileText, FiChevronsRight } from 'react-icons/fi';
import { formatDate } from '../utils';
import './HomeView.css';

const HomeView = ({ 
    user, 
    entries, 
    projects, 
    handleCreateNewClick, 
    handleNoteCardClick,
    handleCreateNewProjectClick,
    handleProjectCardClick 
}) => {
    const recentEntries = entries.slice(0, 5);

    const getProjectEntryCount = (projectId) => {
        if (!projectId) return 0;
        return entries.filter(entry => entry.project?.id === projectId).length;
    };

    return (
        <div className="home-view-dashboard">
            <header className="dashboard-header">
                <h1>안녕하세요, {user?.username}님!</h1>
                <p>Logly에 오신 것을 환영합니다. 오늘 어떤 내용을 기록해볼까요?</p>
            </header>

            <div className="dashboard-grid">
                {/* Stats Section */}
                <div className="dashboard-card stat-card">
                    <FiFileText className="stat-icon" />
                    <div className="stat-info">
                        <h2>{entries.length}</h2>
                        <p>총 노트 수</p>
                    </div>
                </div>
                <div className="dashboard-card stat-card">
                    <FiFolder className="stat-icon" />
                    <div className="stat-info">
                        <h2>{projects.length}</h2>
                        <p>총 프로젝트 수</p>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div className="dashboard-card quick-actions-card">
                    <h3>빠른 작업</h3>
                    <button onClick={handleCreateNewClick} className="action-button">
                        <FiPlus /> 새 노트 작성
                    </button>
                    <button onClick={handleCreateNewProjectClick} className="action-button">
                        <FiPlus /> 새 프로젝트 생성
                    </button>
                </div>

                {/* My Projects Section */}
                <div className="dashboard-card list-card my-projects-card">
                    <h3>내 프로젝트</h3>
                    {projects.length > 0 ? (
                        <ul>
                            {projects.slice(0, 5).map(project => (
                                <li key={project.id} onClick={() => handleProjectCardClick(project)}>
                                    <div className="project-info">
                                        <FiFolder className="item-icon" />
                                        <span>{project.name}</span>
                                    </div>
                                    <div className="project-stats">
                                        <span className="note-count">{getProjectEntryCount(project.id)} 노트</span>
                                        <FiChevronsRight />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="empty-message">아직 생성된 프로젝트가 없습니다.</p>
                    )}
                </div>

                {/* Recent Notes Section */}
                <div className="dashboard-card list-card recent-notes-card">
                    <h3>최근 수정된 노트</h3>
                    {recentEntries.length > 0 ? (
                        <ul>
                            {recentEntries.map(entry => (
                                <li key={entry.id} onClick={() => handleNoteCardClick(entry)}>
                                    <div className="note-info">
                                        <FiFileText className="item-icon" />
                                        <span>{entry.title}</span>
                                    </div>
                                    <small>{formatDate(entry.updatedAt)}</small>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="empty-message">아직 작성된 노트가 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomeView;