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

export const useTimerStore = create<TimerState>((set) => ({
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
  setFromState: (state) => set(state),
  reset: () => set(initialState),
}));
