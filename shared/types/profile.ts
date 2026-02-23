export interface Profile {
  id: string;
  name: string;
  color: string;
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  blockedDomains: string[];
  blockedApps: string[];
  soundPreset?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileInput {
  name: string;
  color?: string;
  focusDuration?: number;
  breakDuration?: number;
  longBreakDuration?: number;
  sessionsBeforeLongBreak?: number;
  blockedDomains?: string[];
  blockedApps?: string[];
  soundPreset?: string | null;
}

export interface UpdateProfileInput {
  id: string;
  name?: string;
  color?: string;
  focusDuration?: number;
  breakDuration?: number;
  longBreakDuration?: number;
  sessionsBeforeLongBreak?: number;
  blockedDomains?: string[];
  blockedApps?: string[];
  soundPreset?: string | null;
}
