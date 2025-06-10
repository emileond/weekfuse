import { cn } from '../../lib/utils.js';
import { motion } from 'framer-motion';

export function OrbitingCircles({
    className,
    children,
    reverse = false,
    duration = 20,
    radius = 160,
    path = true,
    iconSize = 50,
    speed = 1,
    ...props
}) {
    // Adjusted maxRadius to make the orbit smaller and fit within the viewport.
    const maxRadius = Math.min(radius, 120);

    const integrationList = [
        <img
            key="github"
            src="/integrations/github.png"
            alt="GitHub Logo"
            className="w-full h-full object-contain rounded-3xl"
        />,
        <img
            key="clickup"
            src="/integrations/clickup.png"
            alt="ClickUp Logo"
            className="w-full h-full object-contain rounded-3xl"
        />,
        <img
            key="jira"
            src="/integrations/jira.png"
            alt="Jira Logo"
            className="w-full h-full object-contain rounded-3xl"
        />,
        <img
            key="trello"
            src="/integrations/trello.png"
            alt="Trello Logo"
            className="w-full h-full object-contain rounded-3xl"
        />,
        <img
            key="slack"
            src="/integrations/slack.png"
            alt="Slack Logo"
            className="w-full h-full object-contain rounded-3xl"
        />,
    ];

    const calculatedDuration = duration / speed;
    const displayItems =
        children && React.Children.count(children) > 0
            ? React.Children.toArray(children)
            : integrationList;

    return (
        <div
            className="relative flex items-center justify-center w-[340px] my-12 overflow-hidden"
            style={{
                height: `${maxRadius * 2 + iconSize * 1.5}px`,
            }}
        >
            {path && (
                <motion.div
                    className="absolute"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={maxRadius * 2 + iconSize}
                        height={maxRadius * 2 + iconSize}
                        className="pointer-events-none"
                        viewBox={`0 0 ${maxRadius * 2 + iconSize} ${maxRadius * 2 + iconSize}`}
                    >
                        <motion.circle
                            className="stroke-black/10 stroke-[2px] dark:stroke-white/10"
                            cx="50%"
                            cy="50%"
                            r={maxRadius}
                            fill="none"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: 'easeInOut' }}
                        />
                    </svg>
                </motion.div>
            )}

            {displayItems.map((item, index) => {
                const angle = (360 / displayItems.length) * index;
                const startOrbitalRotation = reverse ? angle : -angle;

                const delay = index * 0.2; // Staggered fade-in delay for icons

                return (
                    <motion.div
                        key={index}
                        className="absolute top-1/2 left-1/2"
                        style={{
                            transformOrigin: `50% ${maxRadius + iconSize / 2}px`,
                            y: -(maxRadius + iconSize / 2),
                            x: -iconSize / 2,
                            width: iconSize,
                            height: iconSize,
                        }}
                        initial={{ opacity: 0, rotate: startOrbitalRotation }}
                        animate={{
                            opacity: 1, // Target opacity for initial fade-in
                            rotate: reverse
                                ? [startOrbitalRotation, startOrbitalRotation - 360]
                                : [startOrbitalRotation, startOrbitalRotation + 360],
                        }}
                        transition={{
                            // Define distinct transitions for each property:
                            opacity: { duration: 0.5, delay: delay }, // Faster opacity change
                            rotate: {
                                duration: calculatedDuration,
                                ease: 'linear',
                                repeat: Infinity,
                                repeatType: 'loop',
                            }, // Orbital rotation
                        }}
                        {...props}
                    >
                        <motion.div
                            className={cn(
                                'flex items-center justify-center',
                                'rounded-full bg-white shadow-lg p-1',
                                'hover:scale-110 transition-transform',
                                className,
                            )}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                            animate={{
                                rotate: reverse ? [0, 360] : [0, -360],
                            }}
                            transition={{
                                duration: calculatedDuration,
                                ease: 'linear',
                                repeat: Infinity,
                                repeatType: 'loop',
                            }}
                        >
                            {/* The 'item' is now directly inside this motion.div.
                                The opacity for its appearance is controlled by the parent 'motion.div' above. */}
                            {item}
                        </motion.div>
                    </motion.div>
                );
            })}

            {/* Center element with pulsing effect */}
            <motion.div
                className="absolute rounded-full bg-default-400/10 flex items-center justify-center z-10"
                style={{ width: iconSize * 1.5, height: iconSize * 1.5 }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'loop',
                }}
            >
                <motion.div
                    className="rounded-full bg-background w-3/4 h-3/4 flex items-center justify-center"
                    transition={{
                        duration: calculatedDuration / 2,
                        ease: 'linear',
                        repeat: Infinity,
                    }}
                >
                    <img src="/icon.svg" alt="Weekfuse icon" />
                </motion.div>
            </motion.div>
        </div>
    );
}
