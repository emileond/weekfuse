// components/tasks/VirtualTaskCard.jsx
'use client';
import { useInView } from 'react-intersection-observer';
import TaskCard from './TaskCard.jsx';

// This is a placeholder for when the real card isn't visible.
// Its height should match the real card's height + gap.
const CardPlaceholder = () => <div style={{ height: '90px' }} />;

const VirtualTaskCard = ({ task, sm }) => {
    const { ref, inView } = useInView({
        // The rootMargin creates a buffer, so cards load just before they appear on screen
        rootMargin: '200px 0px',
        // This ensures the component only renders once when it comes into view
        triggerOnce: false,
    });

    return (
        <li ref={ref}>
            {/* If the item is in view, render the full TaskCard. Otherwise, render the simple placeholder. */}
            {inView ? <TaskCard task={task} sm={sm} /> : <CardPlaceholder />}
        </li>
    );
};

export default VirtualTaskCard;
