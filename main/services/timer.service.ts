import { BrowserWindow } from "electron";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import { getDatabase } from "./database.js";

export type TimerPhase = "focus" | "break" | "longBreak" | "idle";
export type TimerStatus = "running" | "paused" | "idle";

export interface TimerState {
  sessionId: string | null;
  phase: TimerPhase;
  status: TimerStatus;
  remainingSeconds: number;
  totalSeconds: number;
  currentPomodoro: number;
  totalPomodoros: number;
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  accumulatedFocusTime: number; // total focus seconds this session
}

export interface TimerTick {
  remainingSeconds: number;
  totalSeconds: number;
  phase: TimerPhase;
  status: TimerStatus;
  currentPomodoro: number;
  accumulatedFocusTime: number;
}

class TimerService {
  private state: TimerState = {
    sessionId: null,
    phase: "idle",
    status: "idle",
    remainingSeconds: 0,
    totalSeconds: 0,
    currentPomodoro: 0,
    totalPomodoros: 0,
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    accumulatedFocusTime: 0,
  };

  private interval: ReturnType<typeof setInterval> | null = null;

  getState(): TimerState {
    return { ...this.state };
  }

  start(
    sessionId: string,
    focusDuration: number,
    breakDuration: number,
    longBreakDuration: number,
    sessionsBeforeLongBreak: number
  ) {
    this.stop();

    this.state = {
      sessionId,
      phase: "focus",
      status: "running",
      remainingSeconds: focusDuration * 60,
      totalSeconds: focusDuration * 60,
      currentPomodoro: 1,
      totalPomodoros: sessionsBeforeLongBreak,
      focusDuration,
      breakDuration,
      longBreakDuration,
      sessionsBeforeLongBreak,
      accumulatedFocusTime: 0,
    };

    this.startInterval();
    this.broadcastStateChange();
  }

  pause() {
    if (this.state.status !== "running") return;
    this.state.status = "paused";
    this.clearInterval();
    this.broadcastStateChange();
  }

  resume() {
    if (this.state.status !== "paused") return;
    this.state.status = "running";
    this.startInterval();
    this.broadcastStateChange();
  }

  stop() {
    this.clearInterval();

    if (this.state.sessionId) {
      // Persist accumulated focus time
      this.persistSessionData();
    }

    this.state = {
      sessionId: null,
      phase: "idle",
      status: "idle",
      remainingSeconds: 0,
      totalSeconds: 0,
      currentPomodoro: 0,
      totalPomodoros: 0,
      focusDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
      accumulatedFocusTime: 0,
    };

    this.broadcastStateChange();
  }

  skip() {
    if (this.state.status === "idle") return;
    this.handlePhaseEnd();
  }

  private startInterval() {
    this.clearInterval();
    this.interval = setInterval(() => this.tick(), 1000);
  }

  private clearInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private tick() {
    if (this.state.status !== "running") return;

    this.state.remainingSeconds--;

    if (this.state.phase === "focus") {
      this.state.accumulatedFocusTime++;
    }

    this.broadcastTick();

    if (this.state.remainingSeconds <= 0) {
      this.handlePhaseEnd();
    }
  }

  private handlePhaseEnd() {
    if (this.state.phase === "focus") {
      // Completed a focus pomodoro
      this.persistSessionData();

      const isLongBreak =
        this.state.currentPomodoro % this.state.sessionsBeforeLongBreak === 0;

      if (isLongBreak) {
        this.state.phase = "longBreak";
        this.state.remainingSeconds = this.state.longBreakDuration * 60;
        this.state.totalSeconds = this.state.longBreakDuration * 60;
      } else {
        this.state.phase = "break";
        this.state.remainingSeconds = this.state.breakDuration * 60;
        this.state.totalSeconds = this.state.breakDuration * 60;
      }
    } else {
      // Break ended, start next focus
      this.state.currentPomodoro++;
      this.state.phase = "focus";
      this.state.remainingSeconds = this.state.focusDuration * 60;
      this.state.totalSeconds = this.state.focusDuration * 60;
    }

    this.broadcastStateChange();
  }

  private persistSessionData() {
    if (!this.state.sessionId) return;
    try {
      const db = getDatabase();
      db.prepare(
        `UPDATE sessions SET completed_pomodoros = ?, total_focus_time = ? WHERE id = ?`
      ).run(
        this.state.currentPomodoro,
        this.state.accumulatedFocusTime,
        this.state.sessionId
      );
    } catch (e) {
      console.error("Failed to persist session data:", e);
    }
  }

  private broadcastTick() {
    const tick: TimerTick = {
      remainingSeconds: this.state.remainingSeconds,
      totalSeconds: this.state.totalSeconds,
      phase: this.state.phase,
      status: this.state.status,
      currentPomodoro: this.state.currentPomodoro,
      accumulatedFocusTime: this.state.accumulatedFocusTime,
    };

    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(IPC_CHANNELS.TIMER_TICK, tick);
    }
  }

  private broadcastStateChange() {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(IPC_CHANNELS.TIMER_STATE_CHANGED, this.getState());
    }
  }
}

export const timerService = new TimerService();
