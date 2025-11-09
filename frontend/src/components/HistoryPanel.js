import React from 'react';
import ReactDiffViewer from 'react-diff-viewer';
import { formatDate } from '../utils';

const HistoryPanel = (props) => {
    const {
        showHistory,
        diffWithVersion,
        setDiffWithVersion,
        setShowHistory,
        selectedEntry,
        versionHistory,
        handleRestoreVersion,
    } = props;

    if (!showHistory) {
        return null;
    }

    return (
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
    );
};

export default HistoryPanel;
