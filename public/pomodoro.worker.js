// pomodoro.worker.js

let timerId = null;
let settings = null;
let state = {
    time: 0,
    mode: 'focus',
    isRunning: false,
    cycle: 1,
    completedPomodoros: 0,
    completedBreaks: 0,
    totalFocusTime: 0,
};

// Main function to handle commands from the React component
self.onmessage = function (e) {
    const { type, payload } = e.data;

    switch (type) {
        case 'start':
            startTimer();
            break;
        case 'pause':
            pauseTimer();
            break;
        case 'reset':
            resetTimer();
            break;
        case 'skip':
            handleTimerComplete(false); // Don't auto-start next timer
            break;
        case 'updateSettings':
            settings = payload;
            // If timer isn't running, reset to new settings
            if (!state.isRunning) {
                resetTimer();
            }
            break;
    }
};

function tick() {
    state.time -= 1;
    // Post the new time back to the UI
    self.postMessage({ type: 'tick', payload: { time: state.time } });

    if (state.time <= 0) {
        handleTimerComplete(true); // Auto-start based on settings
    }
}

function startTimer() {
    if (state.isRunning) return;

    state.isRunning = true;
    self.postMessage({ type: 'statusChange', payload: { isRunning: true } });

    // Clear any existing interval before starting a new one
    clearInterval(timerId);
    timerId = setInterval(tick, 1000);
}

function pauseTimer() {
    state.isRunning = false;
    self.postMessage({ type: 'statusChange', payload: { isRunning: false } });
    clearInterval(timerId);
    timerId = null;
}

function resetTimer() {
    pauseTimer();
    state.mode = 'focus';
    state.cycle = 1;
    state.time = settings.focusDuration * 60;
    // Post the full reset state back to the UI
    self.postMessage({ type: 'stateChange', payload: state });
}

function handleTimerComplete(shouldAutoStart) {
    pauseTimer();

    if (state.mode === 'focus') {
        // Update stats for completed focus session
        state.completedPomodoros += 1;
        state.totalFocusTime += settings.focusDuration * 60;

        // Determine next break type
        if (state.cycle % settings.longBreakInterval === 0) {
            state.mode = 'longBreak';
            state.time = settings.longBreakDuration * 60;
        } else {
            state.mode = 'shortBreak';
            state.time = settings.shortBreakDuration * 60;
        }

        if (shouldAutoStart && settings.autoStartBreaks) {
            startTimer();
        }
    } else {
        // Break completed
        state.completedBreaks += 1;

        // Move to next cycle after break
        if (state.mode === 'longBreak') {
            state.cycle = 1;
        } else {
            state.cycle += 1;
        }

        state.mode = 'focus';
        state.time = settings.focusDuration * 60;

        if (shouldAutoStart && settings.autoStartPomodoros) {
            startTimer();
        }
    }

    // Notify UI of the completion and state change
    self.postMessage({ type: 'complete', payload: { mode: state.mode } });
    self.postMessage({ type: 'stateChange', payload: state });
}
