import { create } from "zustand";
import { getElectronAPI } from "@/lib/electron-api";

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
}

export interface CreateSessionInput {
  task: string;
  intention?: string;
  profileId?: string;
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

interface SessionState {
  activeSession: Session | null;
  loading: boolean;
  createSession: (input: CreateSessionInput) => Promise<Session | null>;
  endSession: (rating?: number, notes?: string) => Promise<void>;
  setActiveSession: (session: Session | null) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  loading: false,

  createSession: async (input) => {
    const api = getElectronAPI();
    if (!api) return null;

    set({ loading: true });
    try {
      const session = await api.session.create(input);
      set({ activeSession: session, loading: false });
      return session;
    } catch (error) {
      console.error("Failed to create session:", error);
      set({ loading: false });
      return null;
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
}));
