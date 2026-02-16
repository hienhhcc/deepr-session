import type { Task } from "./task.js";

export interface Session {
  id: string;
  task: string;
  intention?: string;
  profileId?: string;
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
  completedPomodoros: number;
  totalFocusTime: number; // seconds actually focused
  focusRating?: number; // 1-5
  notes?: string;
  status: "active" | "paused" | "completed" | "cancelled";
  startedAt: string;
  completedAt?: string;
  tasks?: Task[];
}

export interface CreateSessionInput {
  task: string;
  intention?: string;
  profileId?: string;
  focusDuration?: number;
  breakDuration?: number;
  longBreakDuration?: number;
  sessionsBeforeLongBreak?: number;
  taskIds?: string[];
}

export interface UpdateSessionInput {
  id: string;
  focusRating?: number;
  notes?: string;
  status?: Session["status"];
  completedPomodoros?: number;
  totalFocusTime?: number;
}
