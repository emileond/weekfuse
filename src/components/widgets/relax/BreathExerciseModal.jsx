import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal, ModalBody, ModalContent } from '@heroui/react';

// --- SUB-COMPONENT FOR BACKGROUND ANIMATION ---
// NEW: Replaced particles with more noticeable concentric waves
const BackgroundWaves = () => (
    <div className="absolute inset-0 z-0 flex items-center justify-center" aria-hidden="true">
        {[...Array(4)].map((_, i) => (
            <motion.div
                key={`wave-${i}`}
                className="absolute rounded-full border border-default-500/20"
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{
                    duration: 6,
                    ease: 'easeOut',
                    repeat: Infinity,
                    delay: i * 2.5,
                }}
                style={{
                    width: '600px',
                    height: '600px',
                }}
            />
        ))}
    </div>
);

// --- DATA FOR BREATHING ROUTINES ---
const ROUTINES = {
    box: {
        name: 'Box Breathing',
        description: 'Balances and calms the nervous system.',
        cycle: [
            { type: 'inhale', duration: 4, instruction: 'Inhale', detail: 'Through your nose.' },
            { type: 'hold', duration: 4, instruction: 'Hold', detail: 'Relax your shoulders.' },
            { type: 'exhale', duration: 4, instruction: 'Exhale', detail: 'Through your mouth.' },
            {
                type: 'hold-empty',
                duration: 4,
                instruction: 'Hold',
                detail: 'Notice the stillness.',
            },
        ],
    },
    relax: {
        name: '4-7-8 Relaxing Breath',
        description: 'Promotes deep relaxation and helps with sleep.',
        cycle: [
            {
                type: 'inhale',
                duration: 4,
                instruction: 'Inhale',
                detail: 'Gently through your nose.',
            },
            { type: 'hold', duration: 7, instruction: 'Hold', detail: 'Softly close your eyes.' },
            {
                type: 'exhale',
                duration: 8,
                instruction: 'Exhale',
                detail: 'Making a "whoosh" sound.',
            },
        ],
    },
    sigh: {
        name: 'Physiological Sigh',
        description: 'Rapidly reduces stress and anxiety.',
        cycle: [
            {
                type: 'inhale',
                duration: 3,
                instruction: 'Inhale Sharply',
                detail: 'Through the nose to fill lungs.',
            },
            {
                type: 'inhale',
                duration: 1,
                instruction: 'Top It Off',
                detail: 'One more short sip of air.',
            },
            {
                type: 'exhale',
                duration: 6,
                instruction: 'Long Exhale',
                detail: 'Slowly release through your mouth.',
            },
        ],
    },
};

const PREPARE_PHASE = {
    type: 'prepare',
    duration: 4,
    instruction: 'Get Ready...',
    detail: 'Settle into a comfortable position.',
};

const EXERCISE_DURATIONS = {
    short: 30,
    medium: 1 * 60,
    long: 3 * 60,
};

// --- MAIN MODAL COMPONENT ---
export function BreathExerciseModal({ length, routine, onClose }) {
    // FIXED: The randomization logic is now more robust and stable.
    const [selectedRoutine] = useState(() => {
        if (routine && ROUTINES[routine]) {
            return ROUTINES[routine];
        }
        const routineKeys = Object.keys(ROUTINES);
        const randomKey = routineKeys[Math.floor(Math.random() * routineKeys.length)];
        return ROUTINES[randomKey];
    });

    const [activePhase, setActivePhase] = useState({
        ...PREPARE_PHASE,
        name: selectedRoutine.name,
        description: selectedRoutine.description,
    });
    const [cycleIndex, setCycleIndex] = useState(0);
    const [timeLeftInPhase, setTimeLeftInPhase] = useState(PREPARE_PHASE.duration);
    const [totalTimeRemaining, setTotalTimeRemaining] = useState(EXERCISE_DURATIONS[length]);
    const [isComplete, setIsComplete] = useState(false);
    const [isPreparing, setIsPreparing] = useState(true);

    const intervalRef = useRef(null);

    // Main timer and logic loop
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setTimeLeftInPhase((prevTime) => {
                if (prevTime <= 1) {
                    if (isPreparing) {
                        setIsPreparing(false);
                        const nextPhase = selectedRoutine.cycle[0];
                        setActivePhase(nextPhase);
                        setCycleIndex(0);
                        return nextPhase.duration;
                    } else {
                        const nextCycleIndex = (cycleIndex + 1) % selectedRoutine.cycle.length;
                        const nextPhase = selectedRoutine.cycle[nextCycleIndex];
                        setCycleIndex(nextCycleIndex);
                        setActivePhase(nextPhase);
                        return nextPhase.duration;
                    }
                }
                return prevTime - 1;
            });

            if (!isPreparing) {
                setTotalTimeRemaining((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(intervalRef.current);
                        setIsComplete(true);
                        setTimeout(() => onClose(), 3000);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [isPreparing, cycleIndex, onClose, length, selectedRoutine]);

    const circleVariants = {
        prepare: { scale: 0.8 },
        inhale: { scale: 1.5 },
        hold: { scale: 1.5 },
        exhale: { scale: 0.5 },
        'hold-empty': { scale: 0.5 },
    };

    const currentVariantType = isPreparing ? 'prepare' : activePhase.type;

    const formatTotalTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <Modal size="full" isOpen={true} onClose={onClose} className="relative z-50">
            <ModalContent>
                <ModalBody className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden bg-content1">
                    <BackgroundWaves />

                    <div className="flex flex-col items-center justify-center h-full w-full max-w-lg p-4 text-center">
                        {isComplete ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="z-20"
                            >
                                <h2 className="text-4xl font-medium">Great job!</h2>
                                <p className="text-xl text-default-600 mt-2">Exercise complete.</p>
                            </motion.div>
                        ) : (
                            <>
                                {isPreparing && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 1 }}
                                        className="mb-8 z-20"
                                    >
                                        <h2 className="text-3xl font-semibold mb-2">
                                            {activePhase.name}
                                        </h2>
                                        <p className="text-lg text-gray-400">
                                            {activePhase.description}
                                        </p>
                                    </motion.div>
                                )}

                                <motion.div
                                    className="absolute w-[70vw] h-[70vw] max-w-none rounded-full bg-primary-500/20 flex items-center justify-center z-10"
                                    variants={circleVariants}
                                    animate={currentVariantType}
                                    transition={{
                                        duration: activePhase.duration,
                                        ease: 'easeInOut',
                                    }}
                                />

                                <span className="text-7xl md:text-8xl font-bold text-primary select-none z-20">
                                    {timeLeftInPhase}
                                </span>

                                {/* FIXED: Used AnimatePresence for smooth fade transitions on text change */}
                                <div className="mt-8 h-24 flex flex-col justify-center items-center z-20">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activePhase.instruction + cycleIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <h2 className="text-4xl font-medium text-default-700">
                                                {activePhase.instruction}
                                            </h2>
                                            {activePhase.detail && (
                                                <p className="text-xl text-default-600 mt-2">
                                                    {activePhase.detail}
                                                </p>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {!isPreparing && (
                                    <div className="mt-4 text-xl font-medium text-default-500 z-20">
                                        Total Time: {formatTotalTime(totalTimeRemaining)}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
