import React from 'react';
import { useDrag } from 'react-dnd';
import { formatDate } from '../utils';

export const ItemTypes = {
    NOTE: 'note',
};

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
            {/*<p dangerouslySetInnerHTML={{ __html: summary }} />*/}
            <small>{formatDate(entry.updatedAt)}</small>
        </div>
    );
};

export default NoteCard;
