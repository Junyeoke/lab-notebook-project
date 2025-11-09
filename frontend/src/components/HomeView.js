import React, { useMemo } from 'react'; // useMemo 추가
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

    // 명언 목록
    const quotes = useMemo(() => [
        "성공은 최종적인 것이 아니며, 실패는 치명적인 것이 아니다. 중요한 것은 계속하려는 용기이다.",
        "미래는 현재 우리가 무엇을 하는가에 달려 있다.",
        "배움은 끝이 없다. 삶이 있는 한 배움은 계속된다.",
        "가장 큰 위험은 위험 없는 삶을 사는 것이다.",
        "시작이 반이다.",
        "어제는 역사이고, 내일은 미스터리이며, 오늘은 선물이다.",
        "인생은 용기의 연속이다.",
        "꿈을 꾸는 자만이 그 꿈을 이룰 수 있다.",
        "행동이 항상 행복을 가져다주지는 않지만, 행동 없이는 행복이 없다.",
        "가장 어두운 시간에도 희망은 있다."
    ], []);

    // 오늘의 명언 랜덤 선택
    const quoteOfTheDay = useMemo(() => {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        return quotes[randomIndex];
    }, [quotes]); // quotes 배열이 변경될 때만 다시 계산

    return (
        <div className="home-view-dashboard">
            <header className="dashboard-header">
                <h1>안녕하세요, {user?.username}님!</h1>
                <p>Logly에 오신 것을 환영합니다. 오늘 어떤 내용을 기록해볼까요?</p>
                <p className="quote-of-the-day">"{quoteOfTheDay}"</p> {/* 명언 추가 */}
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