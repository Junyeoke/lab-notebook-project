import React from 'react';
import { FiFileText } from 'react-icons/fi';

const WelcomeView = () => (
    <div className="welcome-view">
        <FiFileText />
        <h2>환영합니다!</h2>
        <p>왼쪽에서 노트를 선택하거나 새 노트를 작성하세요.</p>
    </div>
);

export default WelcomeView;
