import { ipcMain } from "electron";
import crypto from "node:crypto";
import { getDatabase } from "../services/database.js";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import { fetchSessionTasks } from "./tasks.ipc.js";
import type {
  Session,
  CreateSessionInput,
  UpdateSessionInput,
} from "../../shared/types/session.js";

function rowToSession(row: Record<string, unknown>): Session {
  return {
    id: row.id as string,
    task: row.task as string,
    intention: row.intention as string | undefined,
    profileId: row.profile_id as string | undefined,
    focusDuration: row.focus_duration as number,
    breakDuration: row.break_duration as number,
    longBreakDuration: row.long_break_duration as number,
    sessionsBeforeLongBreak: row.sessions_before_long_break as number,
    completedPomodoros: row.completed_pomodoros as number,
    totalFocusTime: row.total_focus_time as number,
    focusRating: row.focus_rating as number | undefined,
    notes: row.notes as string | undefined,
    status: row.status as Session["status"],
    startedAt: row.started_at as string,
    completedAt: row.completed_at as string | undefined,
  };
}

export function registerSessionHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.SESSION_CREATE,
    async (_event, input: CreateSessionInput) => {
      const db = getDatabase();
      const id = crypto.randomUUID();

      db.prepare(
        `INSERT INTO sessions (id, task, intention, profile_id, focus_duration, break_duration, long_break_duration, sessions_before_long_break)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        input.task,
        input.intention || null,
        input.profileId || null,
        input.focusDuration || 25,
        input.breakDuration || 5,
        input.longBreakDuration || 15,
        input.sessionsBeforeLongBreak || 4
      );

      // Link tasks to session
      if (input.taskIds && input.taskIds.length > 0) {
        const insertLink = db.prepare(
          "INSERT INTO session_tasks (session_id, task_id, sort_order) VALUES (?, ?, ?)"
        );
        for (let i = 0; i < input.taskIds.length; i++) {
          insertLink.run(id, input.taskIds[i], i);
        }
      }

      const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
      const session = rowToSession(row as Record<string, unknown>);
      session.tasks = fetchSessionTasks(db, id);
      return session;
    }
  );

  ipcMain.handle(IPC_CHANNELS.SESSION_GET, async (_event, id: string) => {
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
    if (!row) return null;
    const session = rowToSession(row as Record<string, unknown>);
    session.tasks = fetchSessionTasks(db, id);
    return session;
  });

  ipcMain.handle(
    IPC_CHANNELS.SESSION_LIST,
    async (
      _event,
      filters?: { status?: string; profileId?: string; limit?: number; offset?: number; search?: string }
    ) => {
      const db = getDatabase();
      const conditions: string[] = [];
      const params: unknown[] = [];
      let needsTaskJoin = false;

      if (filters?.status) {
        conditions.push("s.status = ?");
        params.push(filters.status);
      }
      if (filters?.profileId) {
        conditions.push("s.profile_id = ?");
        params.push(filters.profileId);
      }
      if (filters?.search) {
        conditions.push(
          "(s.task LIKE ? OR s.intention LIKE ? OR s.notes LIKE ? OR t.name LIKE ?)"
        );
        const term = `%${filters.search}%`;
        params.push(term, term, term, term);
        needsTaskJoin = true;
      }

      const join = needsTaskJoin
        ? "LEFT JOIN session_tasks st ON st.session_id = s.id LEFT JOIN tasks t ON t.id = st.task_id"
        : "";
      const where =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const rows = db
        .prepare(
          `SELECT DISTINCT s.* FROM sessions s ${join} ${where} ORDER BY s.started_at DESC LIMIT ? OFFSET ?`
        )
        .all(...params, limit, offset);

      return rows.map((row) => {
        const session = rowToSession(row as Record<string, unknown>);
        session.tasks = fetchSessionTasks(db, session.id);
        return session;
      });
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SESSION_UPDATE,
    async (_event, input: UpdateSessionInput) => {
      const db = getDatabase();
      const fields: string[] = [];
      const values: unknown[] = [];

      if (input.focusRating !== undefined) {
        fields.push("focus_rating = ?");
        values.push(input.focusRating);
      }
      if (input.notes !== undefined) {
        fields.push("notes = ?");
        values.push(input.notes);
      }
      if (input.status !== undefined) {
        fields.push("status = ?");
        values.push(input.status);
        if (input.status === "completed" || input.status === "cancelled") {
          fields.push("completed_at = ?");
          values.push(new Date().toISOString());
        }
      }
      if (input.completedPomodoros !== undefined) {
        fields.push("completed_pomodoros = ?");
        values.push(input.completedPomodoros);
      }
      if (input.totalFocusTime !== undefined) {
        fields.push("total_focus_time = ?");
        values.push(input.totalFocusTime);
      }

      if (fields.length === 0) return null;

      values.push(input.id);
      db.prepare(
        `UPDATE sessions SET ${fields.join(", ")} WHERE id = ?`
      ).run(...values);

      const row = db
        .prepare("SELECT * FROM sessions WHERE id = ?")
        .get(input.id);
      return row ? rowToSession(row as Record<string, unknown>) : null;
    }
  );

  ipcMain.handle(IPC_CHANNELS.SESSION_DELETE, async (_event, id: string) => {
    const db = getDatabase();
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
    return { success: true };
  });
}
