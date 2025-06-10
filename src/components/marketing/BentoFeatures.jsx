import {
    RiGroupLine,
    RiBookletLine,
    RiStackedView,
    RiKanbanView,
    RiPaintBrushLine,
    RiCommandLine,
    RiCalendarScheduleLine,
    RiQuillPenAiLine,
} from 'react-icons/ri';
import { BentoGrid, BentoCard } from './BentoGrid.jsx';

function FeaturesGrid() {
    const bentoFeatures = [
        {
            Icon: RiStackedView,
            name: 'Personal backlog',
            description:
                'Keep all your ideas and future tasks organized in one dedicated space, ready when you are.',
            href: '#',
            cta: 'Learn more',
            className: 'col-span-3 lg:col-span-1',
            background: <></>,
        },
        {
            Icon: RiBookletLine,
            name: 'Notes',
            description:
                'Jot down quick thoughts, project details, or meeting summaries right alongside your tasks.',
            href: '#',
            cta: 'Learn more',
            className: 'col-span-3 lg:col-span-1',
            background: <></>,
        },
        {
            Icon: RiGroupLine,
            name: 'Effortless collaboration',
            description:
                'Need to delegate? Assign tasks to others and add guests for easy, focused collaboration.',
            href: '#',
            cta: 'Learn more',
            className: 'col-span-3 lg:col-span-1',
            background: <></>,
        },
        {
            Icon: RiKanbanView,
            name: 'Flexible views',
            description:
                'Switch between Kanban boards, detailed lists, or comprehensive table views.',
            href: '#',
            cta: 'Learn more',
            className: 'col-span-3 lg:col-span-1',
            background: <img src="/ui-main.png"></img>,
        },
        {
            Icon: RiCalendarScheduleLine,
            name: 'Auto planning',
            description: 'Weekfuse plans your tasks for you, based on your preferences and goals.',
            href: '#',
            cta: 'Learn more',
            className: 'col-span-3 lg:col-span-2',
            background: <></>,
        },
        {
            Icon: RiPaintBrushLine,
            name: 'Themes',
            description: 'Choose from 10+ themes to customize your experience.',
            href: '#',
            cta: 'Learn more',
            className: 'col-span-3 lg:col-span-1',
            background: <></>,
        },
        {
            Icon: RiCommandLine,
            name: 'Shortcuts and Command Palette',
            description: 'Quickly access your most used features with a few keystrokes.',
            href: '#',
            cta: 'Learn more',
            className: 'col-span-3 lg:col-span-1',
            background: <></>,
        },
        {
            Icon: RiQuillPenAiLine,
            name: 'Guided reflections',
            description: 'Reflect on your progress, learn and grow with weekly prompts.',
            href: '#',
            cta: 'Learn more',
            className: 'col-span-3 lg:col-span-1',
            background: <></>,
        },
    ];

    return (
        <div className="max-w-6xl mx-auto py-32 px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Much more than just tasks</h2>
            <BentoGrid>
                {bentoFeatures.map((feature, idx) => (
                    <BentoCard key={idx} {...feature} />
                ))}
            </BentoGrid>
        </div>
    );
}

export default FeaturesGrid;
