'use client';
import { animations } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/react';
import TaskCard from './TaskCard.jsx';
import { useEffect } from 'react';

const DraggableList = ({ id, items, group, smallCards, onDragStart, onDragEnd }) => {
    const [listRef, listItems, updateListItems] = useDragAndDrop(items, {
        group,
        dropZoneClass: 'bg-default text-default-500 opacity-30',
        plugins: [animations()],
        onDragstart: (e) => {
            if (onDragStart) {
                onDragStart(e, id);
            }
        },
        onDragend: (e) => {
            // Ensure the dragged element's z-index is reset to 10
            if (e && e.draggedNode && e.draggedNode.el) {
                e.draggedNode.el.style.zIndex = 10;
            }

            if (onDragEnd) {
                onDragEnd(e, id);
            }
        },
    });

    useEffect(() => {
        // if (listItems.length === items.length) return;
        updateListItems(items);
    }, [items]);

    return (
        <ul id={id} ref={listRef} className="flex flex-col gap-2 w-full h-full overflow-y-auto">
            {listItems?.map((item) => (
                <TaskCard key={item?.id} task={item} sm={smallCards && true} />
            ))}
        </ul>
    );
};

export default DraggableList;
