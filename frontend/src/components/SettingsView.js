import React from 'react';
import { themes } from '../themes';

const SettingsView = ({ applyTheme, currentThemeName }) => {
    return (
        <div className="settings-view">
            <div className="view-header">
                <h1>테마 설정</h1>
            </div>
            <p>애플리케이션의 색상 테마를 변경할 수 있습니다.</p>

            <div className="theme-selector">
                {themes.map(theme => (
                    <div
                        key={theme.name}
                        className={`theme-card ${currentThemeName === theme.name ? 'active' : ''}`}
                        onClick={() => applyTheme(theme)}
                    >
                        <div className="theme-preview">
                            <div className="preview-color" style={{ backgroundColor: theme.colors['--color-primary'] }}></div>
                            <div className="preview-color" style={{ backgroundColor: theme.colors['--color-secondary'] }}></div>
                            <div className="preview-color" style={{ backgroundColor: theme.colors['--color-text-dark'] }}></div>
                            <div className="preview-color" style={{ backgroundColor: theme.colors['--color-background'] }}></div>
                        </div>
                        <div className="theme-name">
                            {theme.name}
                            {currentThemeName === theme.name && <span className="active-badge">✓</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SettingsView;
