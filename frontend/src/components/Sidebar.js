import React from 'react';
import { FiPlusSquare, FiHome, FiFolder, FiClipboard, FiSettings } from 'react-icons/fi';
import { Button } from 'react-bootstrap';

const Sidebar = ({ currentView, onNavigate, handleCreateNewClick }) => {

    const navItems = [
        { view: 'home', icon: <FiHome />, label: '홈' },
        { view: 'projects', icon: <FiFolder />, label: '프로젝트' },
        { view: 'templates', icon: <FiClipboard />, label: '템플릿' },
        { view: 'settings', icon: <FiSettings />, label: '설정' },
    ];

    return (
        <nav className="main-nav">
            <div className="main-nav-header">
                <Button onClick={handleCreateNewClick} className="btn-primary w-100">
                    <FiPlusSquare size={20} />
                    <span>새 노트</span>
                </Button>
            </div>
            <ul className="main-nav-list">
                {navItems.map(item => (
                    <li key={item.view} className={`main-nav-item ${currentView === item.view ? 'active' : ''}`}>
                        <button onClick={() => onNavigate(item.view)}>
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Sidebar;
