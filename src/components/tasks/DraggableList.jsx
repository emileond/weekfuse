'use client';
import { animations } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/react';
import TaskCard from './TaskCard.jsx';
import { useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const DraggableList = ({ id, items, group, smallCards, onDragStart, onDragEnd }) => {
    // ✅ FIX: The first item from this hook is the ref OBJECT we need to give to our container.
    const [parentRef, listItems, updateListItems] = useDragAndDrop(items, {
        group,
        dropZoneClass: 'bg-default text-default-500 opacity-30',
        plugins: [animations()],
        onDragstart: onDragStart ? (e) => onDragStart(e, id) : undefined,
        onDragend: onDragEnd ? (e) => onDragEnd(e, id) : undefined,
    });

    // This effect still correctly keeps the list in sync with prop changes
    useEffect(() => {
        updateListItems(items);
    }, [items]);

    // The virtualizer hook
    const rowVirtualizer = useVirtualizer({
        count: listItems.length,
        // ✅ FIX: We directly use the ref from useDragAndDrop.
        // The virtualizer just needs a function that returns the DOM element.
        getScrollElement: () => parentRef.current,
        estimateSize: () => 90, // IMPORTANT: Adjust this to match your TaskCard's height
        overscan: 5,
    });

    return (
        // 1. ✅ FIX: The scrollable container gets the ref directly from useDragAndDrop.
        // This single ref is now used by both libraries.
        <div
            ref={parentRef}
            id={id}
            className="w-full h-full overflow-y-auto"
            style={{ contain: 'strict' }} // Performance hint for virtual lists
        >
            {/* 2. This inner div gets the total height from the virtualizer. */}
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {/* 3. We map over the virtual items as before. */}
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const item = listItems[virtualItem.index];
                    return (
                        <div
                            key={item.id}
                            // The data-index helps FormKit identify nodes
                            data-index={virtualItem.index}
                            ref={rowVirtualizer.measureElement}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                            className="pb-1"
                        >
                            <TaskCard task={item} sm={smallCards} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DraggableList;
