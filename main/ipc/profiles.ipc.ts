import { ipcMain } from "electron";
import crypto from "node:crypto";
import { getDatabase } from "../services/database.js";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import type {
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
} from "../../shared/types/profile.js";

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    focusDuration: row.focus_duration as number,
    breakDuration: row.break_duration as number,
    longBreakDuration: row.long_break_duration as number,
    sessionsBeforeLongBreak: row.sessions_before_long_break as number,
    blockedDomains: JSON.parse((row.blocked_domains as string) || "[]"),
    blockedApps: JSON.parse((row.blocked_apps as string) || "[]"),
    soundPreset: row.sound_preset as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function registerProfileHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.PROFILE_CREATE,
    async (_event, input: CreateProfileInput) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      db.prepare(
        `INSERT INTO profiles (id, name, color, focus_duration, break_duration, long_break_duration, sessions_before_long_break, blocked_domains, blocked_apps, sound_preset, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        input.name,
        input.color || "#2d6a4f",
        input.focusDuration || 25,
        input.breakDuration || 5,
        input.longBreakDuration || 15,
        input.sessionsBeforeLongBreak || 4,
        JSON.stringify(input.blockedDomains || []),
        JSON.stringify(input.blockedApps || []),
        input.soundPreset || null,
        now,
        now
      );

      const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id);
      return rowToProfile(row as Record<string, unknown>);
    }
  );

  ipcMain.handle(IPC_CHANNELS.PROFILE_GET, async (_event, id: string) => {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(id);
    return row ? rowToProfile(row as Record<string, unknown>) : null;
  });

  ipcMain.handle(IPC_CHANNELS.PROFILE_LIST, async () => {
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM profiles ORDER BY created_at DESC")
      .all();
    return rows.map((row) => rowToProfile(row as Record<string, unknown>));
  });

  ipcMain.handle(
    IPC_CHANNELS.PROFILE_UPDATE,
    async (_event, input: UpdateProfileInput) => {
      const db = getDatabase();
      const fields: string[] = [];
      const values: unknown[] = [];

      if (input.name !== undefined) {
        fields.push("name = ?");
        values.push(input.name);
      }
      if (input.color !== undefined) {
        fields.push("color = ?");
        values.push(input.color);
      }
      if (input.focusDuration !== undefined) {
        fields.push("focus_duration = ?");
        values.push(input.focusDuration);
      }
      if (input.breakDuration !== undefined) {
        fields.push("break_duration = ?");
        values.push(input.breakDuration);
      }
      if (input.longBreakDuration !== undefined) {
        fields.push("long_break_duration = ?");
        values.push(input.longBreakDuration);
      }
      if (input.sessionsBeforeLongBreak !== undefined) {
        fields.push("sessions_before_long_break = ?");
        values.push(input.sessionsBeforeLongBreak);
      }
      if (input.blockedDomains !== undefined) {
        fields.push("blocked_domains = ?");
        values.push(JSON.stringify(input.blockedDomains));
      }
      if (input.blockedApps !== undefined) {
        fields.push("blocked_apps = ?");
        values.push(JSON.stringify(input.blockedApps));
      }
      if (input.soundPreset !== undefined) {
        fields.push("sound_preset = ?");
        values.push(input.soundPreset);
      }

      fields.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(input.id);

      db.prepare(
        `UPDATE profiles SET ${fields.join(", ")} WHERE id = ?`
      ).run(...values);

      const row = db
        .prepare("SELECT * FROM profiles WHERE id = ?")
        .get(input.id);
      return row ? rowToProfile(row as Record<string, unknown>) : null;
    }
  );

  ipcMain.handle(IPC_CHANNELS.PROFILE_DELETE, async (_event, id: string) => {
    const db = getDatabase();
    db.prepare("DELETE FROM profiles WHERE id = ?").run(id);
    return { success: true };
  });
}
