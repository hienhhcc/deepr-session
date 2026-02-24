import { create } from "zustand";

export type TimerPhase = "focus" | "break" | "longBreak" | "idle";
export type TimerStatus = "running" | "paused" | "idle";

export interface TimerTick {
  remainingSeconds: number;
  totalSeconds: number;
  phase: TimerPhase;
  status: TimerStatus;
  currentPomodoro: number;
  accumulatedFocusTime: number;
}

interface TimerState {
  phase: TimerPhase;
  status: TimerStatus;
  remainingSeconds: number;
  totalSeconds: number;
  currentPomodoro: number;
  accumulatedFocusTime: number;
  setFromTick: (tick: TimerTick) => void;
  setFromState: (state: Partial<TimerTick>) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as TimerPhase,
  status: "idle" as TimerStatus,
  remainingSeconds: 0,
  totalSeconds: 0,
  currentPomodoro: 0,
  accumulatedFocusTime: 0,
};

/** Play a short chime via Web Audio API for phase transitions. */
function playTransitionChime(type: "break" | "focus") {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === "break") {
      // Gentle ascending chime: C5 → E5 → G5 (time to relax)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.4);
      });
      setTimeout(() => ctx.close(), 1000);
    } else {
      // Brighter double chime: G5 → C6 (back to work)
      const notes = [783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.35);
      });
      setTimeout(() => ctx.close(), 800);
    }
  } catch {
    // AudioContext not available — skip silently
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  ...initialState,
  setFromTick: (tick) =>
    set({
      phase: tick.phase,
      status: tick.status,
      remainingSeconds: tick.remainingSeconds,
      totalSeconds: tick.totalSeconds,
      currentPomodoro: tick.currentPomodoro,
      accumulatedFocusTime: tick.accumulatedFocusTime,
    }),
  setFromState: (state) => {
    const prev = get();
    set(state);
    // Play chime on phase transitions (only when timer is running)
    if (state.phase && state.phase !== prev.phase && prev.phase !== "idle") {
      if (state.phase === "break" || state.phase === "longBreak") {
        playTransitionChime("break");
      } else if (state.phase === "focus") {
        playTransitionChime("focus");
      }
    }
  },
  reset: () => set(initialState),
}));
