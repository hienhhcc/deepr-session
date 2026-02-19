import { create } from "zustand";
import { getElectronAPI } from "@/lib/electron-api";

import type { Task } from "./task.store";

export interface Session {
  id: string;
  task: string;
  intention?: string;
  profileId?: string;
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  completedPomodoros: number;
  totalFocusTime: number;
  focusRating?: number;
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
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  taskIds?: string[];
}

interface SessionState {
  activeSession: Session | null;
  loading: boolean;
  createSession: (input: CreateSessionInput) => Promise<Session | null>;
  endSession: (rating?: number, notes?: string) => Promise<void>;
  setActiveSession: (session: Session | null) => void;
  updateSessionTasks: (taskIds: string[]) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  loading: false,

  createSession: async (input) => {
    const api = getElectronAPI();
    if (!api) {
      console.error("Electron API not available — session creation skipped");
      return null;
    }

    set({ loading: true });
    try {
      const session = (await api.session.create(input)) as Session;
      if (!session?.id) {
        console.error("Session creation returned invalid data:", session);
        set({ loading: false });
        return null;
      }
      set({ activeSession: session, loading: false });
      return session;
    } catch (error) {
      console.error("Failed to create session:", error);
      set({ loading: false });
      throw error;
    }
  },

  endSession: async (rating?: number, notes?: string) => {
    const api = getElectronAPI();
    const { activeSession } = get();
    if (!api || !activeSession) return;

    set({ loading: true });
    try {
      await api.session.update({
        id: activeSession.id,
        status: "completed",
        focusRating: rating,
        notes,
      });
      set({ activeSession: null, loading: false });
    } catch (error) {
      console.error("Failed to end session:", error);
      set({ loading: false });
    }
  },

  setActiveSession: (session) => set({ activeSession: session }),

  updateSessionTasks: async (taskIds: string[]) => {
    const api = getElectronAPI();
    const { activeSession } = get();
    if (!api || !activeSession) return;
    // Guard: method may not exist if main process hasn't been rebuilt
    if (typeof api.session.updateTasks !== "function") {
      console.warn("session.updateTasks IPC not available — rebuild and restart the app");
      return;
    }
    try {
      const tasks = await api.session.updateTasks(activeSession.id, taskIds);
      set((state) => ({
        activeSession: state.activeSession
          ? { ...state.activeSession, tasks }
          : null,
      }));
    } catch (error) {
      console.error("Failed to update session tasks:", error);
    }
  },
}));
