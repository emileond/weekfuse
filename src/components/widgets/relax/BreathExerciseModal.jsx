import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Modal, ModalBody, ModalContent } from '@heroui/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
// NEW: Import react-icons
import { RiVolumeUpLine, RiVolumeMuteLine } from 'react-icons/ri';


// --- SUB-COMPONENT FOR BACKGROUND ANIMATION ---
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
            { type: 'inhale', duration: 4, instruction: 'Inhale 👃', detail: 'Through your nose.' },
            { type: 'hold', duration: 4, instruction: 'Hold 😶', detail: 'Relax your shoulders.' },
            { type: 'exhale', duration: 4, instruction: 'Exhale 😌', detail: 'Through your mouth.' },
            { type: 'hold-empty', duration: 4, instruction: 'Hold 😶', detail: 'Notice the stillness.' },
        ],
    },
    relax: {
        name: '4-7-8 Relaxing Breath',
        description: 'Promotes deep relaxation and helps with sleep.',
        cycle: [
            { type: 'inhale', duration: 4, instruction: 'Inhale 👃', detail: 'Gently through your nose.' },
            { type: 'hold', duration: 7, instruction: 'Hold', detail: 'Softly close your eyes.' },
            { type: 'exhale', duration: 8, instruction: 'Exhale 😌', detail: 'Making a "whoosh" sound.' },
        ],
    },
    sigh: {
        name: 'Physiological Sigh',
        description: 'Rapidly reduces stress and anxiety.',
        cycle: [
            { type: 'inhale ', duration: 3, instruction: 'Inhale Sharply 👃', detail: 'Through the nose to fill lungs.' },
            { type: 'inhale', duration: 2, instruction: 'Top It Off 👃', detail: 'One more short sip of air.' },
            { type: 'exhale', duration: 6, instruction: 'Long Exhale 😌', detail: 'Slowly release through your mouth.' },
        ],
    },
};

const PREPARE_PHASE = {
    type: 'prepare',
    duration: 4,
    instruction: 'Get Ready...',
    detail: 'Settle into a comfortable position.',
};

const EXERCISE_DURATIONS = { short: 30, medium: 1 * 60, long: 3 * 60 };

const COMPLETION_MESSAGES = [
    { title: 'A mindful reset', subtitle: 'Ready to approach your day with clarity.' },
    { title: 'Space to breathe', subtitle: 'Carry this focus into your next task.' },
    { title: 'Nicely done', subtitle: 'You took a moment just for you.' },
    { title: 'Well handled', subtitle: "Notice the stillness you've created." },
    { title: 'And... exhale', subtitle: 'Gently bring your awareness back to the room.' },
    { title: 'Pause complete', subtitle: 'A clear mind for what comes next.' },
];

// --- MAIN MODAL COMPONENT ---
export function BreathExerciseModal({ length, routine, onClose }) {
    const [selectedRoutine] = useState(() => {
        if (routine && ROUTINES[routine]) return ROUTINES[routine];
        const routineKeys = Object.keys(ROUTINES);
        return ROUTINES[routineKeys[Math.floor(Math.random() * routineKeys.length)]];
    });

    const [activePhase, setActivePhase] = useState({ ...PREPARE_PHASE, name: selectedRoutine.name, description: selectedRoutine.description });
    const [cycleIndex, setCycleIndex] = useState(0);
    const [timeLeftInPhase, setTimeLeftInPhase] = useState(PREPARE_PHASE.duration);
    const [totalTimeRemaining, setTotalTimeRemaining] = useState(EXERCISE_DURATIONS[length]);
    const [isComplete, setIsComplete] = useState(false);
    const [isPreparing, setIsPreparing] = useState(true);
    const [completionMessage, setCompletionMessage] = useState(null);
    // NEW: State to control music
    const [isMusicOn, setIsMusicOn] = useState(true);

    const intervalRef = useRef(null);
    const audioRef = useRef(null);
    const fadeOutIntervalRef = useRef(null);

    // --- AUDIO CONTROL ---
    useEffect(() => {
        audioRef.current = new Audio('/sounds/levitation-music.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.1;

        return () => {
            clearInterval(fadeOutIntervalRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        // Play audio only if music is on and not preparing
        if (audioRef.current && isMusicOn) {
            audioRef.current.play().catch((error) => console.warn('Audio playback failed:', error));
        }
    }, [isPreparing, isMusicOn]);

    useEffect(() => {
        // Fade out only if music was on
        if (isComplete && audioRef.current && isMusicOn) {
            const audio = audioRef.current;
            clearInterval(fadeOutIntervalRef.current);
            fadeOutIntervalRef.current = setInterval(() => {
                if (audio.volume > 0.01) {
                    audio.volume -= 0.01;
                } else {
                    clearInterval(fadeOutIntervalRef.current);
                    audio.pause();
                }
            }, 300);
        }
    }, [isComplete, isMusicOn]);

    // NEW: Function to toggle music state and playback
    const toggleMusic = () => {
        setIsMusicOn(prev => {
            const isNowOn = !prev;
            if (audioRef.current) {
                if (isNowOn) {
                    audioRef.current.play().catch((e) => console.warn("Audio play failed on toggle:", e));
                } else {
                    audioRef.current.pause();
                }
            }
            return isNowOn;
        });
    };

    // --- TIMER LOGIC ---
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
                        const randomMessage = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
                        setCompletionMessage(randomMessage);
                        setIsComplete(true);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [isPreparing, cycleIndex, selectedRoutine]);

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

    const handleClose = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        onClose();
    };

    return (
        <Modal size="full" isOpen={true} onClose={handleClose} className="relative z-50">
            <ModalContent>
                <ModalBody className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden">
                    {!isComplete && <BackgroundWaves />}
                    <div className="flex flex-col items-center justify-center h-full w-full max-w-lg p-4 text-center">
                        {isComplete && completionMessage ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="z-20 flex flex-col items-center"
                            >
                                <div className="h-80">
                                    <DotLottieReact src="/lottie/heart.lottie" autoplay loop />
                                </div>
                                <h2 className="text-4xl font-semibold">{completionMessage.title}</h2>
                                <p className="text-xl text-default-600 mt-2">{completionMessage.subtitle}</p>
                            </motion.div>
                        ) : (
                            <>
                                <motion.div
                                    className="absolute w-[60vw] h-[60vw] max-w-none rounded-full bg-primary-500/20 flex items-center justify-center z-10"
                                    variants={circleVariants}
                                    animate={currentVariantType}
                                    transition={{ duration: activePhase.duration, ease: 'easeInOut' }}
                                />
                                <span className="text-7xl md:text-8xl font-black text-primary select-none z-10">
                                    {timeLeftInPhase}
                                </span>
                                <div className="mt-8 h-24 flex flex-col justify-center items-center z-10">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activePhase.instruction + cycleIndex}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <h2 className="text-4xl font-semibold text-default-700">{activePhase.instruction}</h2>
                                            {activePhase.detail && <p className="text-xl text-default-600 mt-2">{activePhase.detail}</p>}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                {!isPreparing && (
                                    <div className="fixed bottom-8 py-6 text-default-600 z-10">
                                        Remaining time: {formatTotalTime(totalTimeRemaining)}
                                    </div>
                                )}
                            </>
                        )}

                        {/* --- BOTTOM CONTROLS --- */}
                        <div className="mt-9 z-20 flex items-center gap-4">
                            {isComplete ? (
                                <Button color="primary" variant="ghost" onPress={handleClose}>
                                    Done
                                </Button>
                            ) : (
                                <>
                                    <Button color="primary" variant="ghost" onPress={handleClose}>
                                        End Early
                                    </Button>
                                    <Button
                                        isIconOnly
                                        variant="ghost"
                                        color="primary"
                                        aria-label="Toggle Music"
                                        onPress={toggleMusic}
                                    >
                                        {isMusicOn ? <RiVolumeUpLine size={20} /> : <RiVolumeMuteLine size={20} />}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}