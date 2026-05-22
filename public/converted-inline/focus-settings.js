
        const STORAGE_KEY = "prism.focusTimer.v2";
        const todayKey = new Date().toISOString().slice(0, 10);
        const defaults = {
            focusMinutes: 25,
            shortBreakMinutes: 5,
            longBreakMinutes: 15,
            sessionsBeforeLongBreak: 4,
            currentPhase: "focus",
            timeLeft: 25 * 60,
            running: false,
            completedFocusSessionsInCycle: 0,
            taskLabel: "",
            stats: { date: todayKey, sessions: 0, focusSeconds: 0 }
        };

        let state = loadState();
        let timerId = null;
        let audioContext = null;
        const phaseNames = { focus: "Focus", shortBreak: "Short break", longBreak: "Long break" };

        const timeDisplay = document.getElementById("timeDisplay");
        const phaseLabel = document.getElementById("phaseLabel");
        const taskDisplay = document.getElementById("taskDisplay");
        const taskInput = document.getElementById("taskInput");
        const ring = document.getElementById("ring");
        const sessionDots = document.getElementById("sessionDots");
        const sessionsToday = document.getElementById("sessionsToday");
        const focusTimeToday = document.getElementById("focusTimeToday");

        function loadState() {
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
                if (saved) {
                    const merged = { ...defaults, ...saved };
                    if (!merged.stats || merged.stats.date !== todayKey) {
                        merged.stats = { date: todayKey, sessions: 0, focusSeconds: 0 };
                    }
                    return merged;
                }
            } catch {}
            return { ...defaults };
        }

        function saveState() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }

        function phaseDuration(phase = state.currentPhase) {
            if (phase === "focus") return state.focusMinutes * 60;
            if (phase === "shortBreak") return state.shortBreakMinutes * 60;
            return state.longBreakMinutes * 60;
        }

        function formatTime(seconds) {
            const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
            const secs = String(seconds % 60).padStart(2, "0");
            return minutes + ":" + secs;
        }

        function renderDots() {
            sessionDots.innerHTML = "";
            for (let i = 0; i < state.sessionsBeforeLongBreak; i += 1) {
                const dot = document.createElement("div");
                dot.className = "dot" + (i < state.completedFocusSessionsInCycle ? " done" : "");
                sessionDots.appendChild(dot);
            }
        }

        function render() {
            phaseLabel.textContent = phaseNames[state.currentPhase];
            timeDisplay.textContent = formatTime(state.timeLeft);
            taskDisplay.textContent = state.taskLabel.trim() || "No task set";
            taskInput.value = state.taskLabel;
            document.getElementById("startPauseBtn").textContent = state.running ? "Pause" : "Start";
            const duration = phaseDuration();
            const progress = duration ? ((duration - state.timeLeft) / duration) * 100 : 0;
            ring.style.setProperty("--progress", progress.toFixed(2));
            renderDots();
            sessionsToday.textContent = state.stats.sessions;
            focusTimeToday.textContent = Math.round(state.stats.focusSeconds / 60) + "m";

            document.getElementById("focusMinutes").value = state.focusMinutes;
            document.getElementById("shortBreakMinutes").value = state.shortBreakMinutes;
            document.getElementById("longBreakMinutes").value = state.longBreakMinutes;
            document.getElementById("sessionsBeforeLongBreak").value = state.sessionsBeforeLongBreak;
        }

        function bellTone() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            const now = audioContext.currentTime;
            const gain = audioContext.createGain();
            gain.connect(audioContext.destination);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

            [783.99, 1046.5].forEach((frequency, index) => {
                const osc = audioContext.createOscillator();
                osc.type = "sine";
                osc.frequency.setValueAtTime(frequency, now);
                osc.connect(gain);
                osc.start(now + index * 0.12);
                osc.stop(now + 1.5);
            });
        }

        function nextPhase() {
            if (state.currentPhase === "focus") {
                state.completedFocusSessionsInCycle += 1;
                state.stats.sessions += 1;
                const isLongBreak = state.completedFocusSessionsInCycle % state.sessionsBeforeLongBreak === 0;
                state.currentPhase = isLongBreak ? "longBreak" : "shortBreak";
            } else {
                state.currentPhase = "focus";
            }
            state.timeLeft = phaseDuration(state.currentPhase);
            bellTone();
            saveState();
            render();
        }

        function startTimer() {
            if (timerId) return;
            state.running = true;
            timerId = setInterval(() => {
                state.timeLeft -= 1;
                if (state.currentPhase === "focus") {
                    state.stats.focusSeconds += 1;
                }
                if (state.timeLeft <= 0) {
                    clearInterval(timerId);
                    timerId = null;
                    state.running = false;
                    nextPhase();
                }
                saveState();
                render();
            }, 1000);
            saveState();
            render();
        }

        function pauseTimer() {
            clearInterval(timerId);
            timerId = null;
            state.running = false;
            saveState();
            render();
        }

        function resetTimer() {
            pauseTimer();
            state.timeLeft = phaseDuration();
            render();
        }

        function applySetting(key, value) {
            state[key] = value;
            if (!state.running) {
                state.timeLeft = phaseDuration();
            }
            saveState();
            render();
        }

        document.getElementById("startPauseBtn").addEventListener("click", () => {
            if (state.running) pauseTimer();
            else startTimer();
        });
        document.getElementById("resetBtn").addEventListener("click", resetTimer);
        document.getElementById("skipBtn").addEventListener("click", () => {
            pauseTimer();
            nextPhase();
        });

        taskInput.addEventListener("input", () => {
            state.taskLabel = taskInput.value;
            saveState();
            render();
        });

        ["focusMinutes", "shortBreakMinutes", "longBreakMinutes", "sessionsBeforeLongBreak"].forEach((id) => {
            document.getElementById(id).addEventListener("input", (event) => {
                const value = Math.max(1, Number(event.target.value) || defaults[id]);
                applySetting(id, value);
            });
        });

        document.getElementById("minimalBtn").addEventListener("click", () => {
            document.body.classList.toggle("minimal");
        });

        document.getElementById("fullscreenBtn").addEventListener("click", async () => {
            if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
            else await document.exitFullscreen();
        });

        render();
    