import React from 'react';
import ReactDiffViewer from '@alexbruf/react-diff-viewer';
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
                        
                        {/* [추가] 변경사항 요약 UI */}
                        <div className="diff-summary">
                            <h4>변경 요약</h4>
                            {diffWithVersion.title !== selectedEntry.title && (
                                <div className="summary-item">
                                    <strong>제목:</strong>
                                    <span className="old-value">{diffWithVersion.title}</span> → <span className="new-value">{selectedEntry.title}</span>
                                </div>
                            )}
                            {diffWithVersion.tags.join(', ') !== selectedEntry.tags.join(', ') && (
                                <div className="summary-item">
                                    <strong>태그:</strong>
                                    <span className="old-value">{diffWithVersion.tags.join(', ') || '없음'}</span> → <span className="new-value">{selectedEntry.tags.join(', ') || '없음'}</span>
                                </div>
                            )}
                            {(diffWithVersion.title === selectedEntry.title && diffWithVersion.tags.join(', ') === selectedEntry.tags.join(', ')) && (
                                <p>제목과 태그는 변경되지 않았습니다.</p>
                            )}
                        </div>

                        <div className="diff-viewer-container">
                            <ReactDiffViewer
                                oldValue={diffWithVersion.content}
                                newValue={selectedEntry.content}
                                splitView={true}
                                leftTitle={<span className="diff-title-old">{`이전 버전 (${formatDate(diffWithVersion.versionTimestamp)})`}</span>}
                                rightTitle={<span className="diff-title-current">현재 버전</span>}
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
                                    <span>{formatDate(version.versionTimestamp)} by {version.modifiedBy?.username || 'Unknown'}</span>
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
