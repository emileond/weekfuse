// DraggableList.jsx
'use client';
import { animations } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/react';
// ✅ Import our new wrapper component
import VirtualTaskCard from './VirtualTaskCard.jsx';
import { useEffect } from 'react';

const DraggableList = ({ id, items, group, smallCards, onDragStart, onDragEnd }) => {
    // ✅ The useDragAndDrop hook works perfectly with this simpler structure.
    const [listRef, listItems, updateListItems] = useDragAndDrop(items, {
        group,
        dropZoneClass: 'bg-default text-default-500 opacity-30',
        plugins: [animations()],
        onDragstart: onDragStart ? (e) => onDragStart(e, id) : undefined,
        onDragend: onDragEnd
            ? (e) => {
                  if (e && e.draggedNode && e.draggedNode.el) {
                      e.draggedNode.el.style.zIndex = 10;
                  }
                  return onDragEnd(e, id);
              }
            : undefined,
    });

    useEffect(() => {
        updateListItems(items);
    }, [items]);

    return (
        // ✅ This is a simple, scrollable list again.
        // The performance comes from the VirtualTaskCard, not from removing DOM nodes.
        <ul id={id} ref={listRef} className="flex flex-col gap-1 w-full h-full overflow-y-auto p-1">
            {/* We map over ALL items, but only the visible ones will render their full content. */}
            {listItems?.map((item) => (
                <VirtualTaskCard key={item.id} task={item} sm={smallCards} />
            ))}
        </ul>
    );
};

export default DraggableList;
