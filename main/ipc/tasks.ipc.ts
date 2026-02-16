import { ipcMain } from "electron";
import crypto from "node:crypto";
import { getDatabase } from "../services/database.js";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import type {
  Task,
  Subtask,
  CreateTaskInput,
  UpdateTaskInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
  TaskFilters,
} from "../../shared/types/task.js";

function rowToTask(row: Record<string, unknown>, subtasks: Subtask[] = []): Task {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    subtasks,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToSubtask(row: Record<string, unknown>): Subtask {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    name: row.name as string,
    done: (row.done as number) === 1,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  };
}

function fetchTaskSubtasks(db: ReturnType<typeof getDatabase>, taskId: string): Subtask[] {
  const rows = db
    .prepare("SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC, created_at ASC")
    .all(taskId);
  return rows.map((row) => rowToSubtask(row as Record<string, unknown>));
}

function fetchFullTask(db: ReturnType<typeof getDatabase>, taskId: string): Task | null {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
  if (!row) return null;
  const subtasks = fetchTaskSubtasks(db, taskId);
  return rowToTask(row as Record<string, unknown>, subtasks);
}

export function fetchSessionTasks(db: ReturnType<typeof getDatabase>, sessionId: string): Task[] {
  const rows = db
    .prepare(
      `SELECT t.* FROM tasks t
       JOIN session_tasks st ON st.task_id = t.id
       WHERE st.session_id = ?
       ORDER BY st.sort_order ASC`
    )
    .all(sessionId);

  return rows.map((row) => {
    const taskRow = row as Record<string, unknown>;
    const subtasks = fetchTaskSubtasks(db, taskRow.id as string);
    return rowToTask(taskRow, subtasks);
  });
}

export function registerTaskHandlers() {
  // Task CRUD
  ipcMain.handle(
    IPC_CHANNELS.TASK_CREATE,
    async (_event, input: CreateTaskInput) => {
      const db = getDatabase();
      const id = crypto.randomUUID();

      db.prepare(
        `INSERT INTO tasks (id, name, description, status, priority)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        id,
        input.name,
        input.description || null,
        input.status || "todo",
        input.priority || "medium"
      );

      return fetchFullTask(db, id);
    }
  );

  ipcMain.handle(IPC_CHANNELS.TASK_GET, async (_event, id: string) => {
    const db = getDatabase();
    return fetchFullTask(db, id);
  });

  ipcMain.handle(
    IPC_CHANNELS.TASK_LIST,
    async (_event, filters?: TaskFilters) => {
      const db = getDatabase();
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (filters?.status) {
        conditions.push("status = ?");
        params.push(filters.status);
      }
      if (filters?.priority) {
        conditions.push("priority = ?");
        params.push(filters.priority);
      }
      if (filters?.search) {
        conditions.push("(name LIKE ? OR description LIKE ?)");
        const term = `%${filters.search}%`;
        params.push(term, term);
      }

      const where =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const limit = filters?.limit || 100;
      const offset = filters?.offset || 0;

      const rows = db
        .prepare(
          `SELECT * FROM tasks ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
        )
        .all(...params, limit, offset);

      return rows.map((row) => {
        const taskRow = row as Record<string, unknown>;
        const subtasks = fetchTaskSubtasks(db, taskRow.id as string);
        return rowToTask(taskRow, subtasks);
      });
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.TASK_UPDATE,
    async (_event, input: UpdateTaskInput) => {
      const db = getDatabase();
      const fields: string[] = [];
      const values: unknown[] = [];

      if (input.name !== undefined) {
        fields.push("name = ?");
        values.push(input.name);
      }
      if (input.description !== undefined) {
        fields.push("description = ?");
        values.push(input.description);
      }
      if (input.status !== undefined) {
        fields.push("status = ?");
        values.push(input.status);
      }
      if (input.priority !== undefined) {
        fields.push("priority = ?");
        values.push(input.priority);
      }

      if (fields.length === 0) return fetchFullTask(db, input.id);

      fields.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(input.id);

      db.prepare(
        `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`
      ).run(...values);

      return fetchFullTask(db, input.id);
    }
  );

  ipcMain.handle(IPC_CHANNELS.TASK_DELETE, async (_event, id: string) => {
    const db = getDatabase();
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    return { success: true };
  });

  // Subtask handlers
  ipcMain.handle(
    IPC_CHANNELS.SUBTASK_CREATE,
    async (_event, input: CreateSubtaskInput) => {
      const db = getDatabase();
      const id = crypto.randomUUID();

      // Get next sort order
      const maxRow = db
        .prepare("SELECT MAX(sort_order) as max_order FROM subtasks WHERE task_id = ?")
        .get(input.taskId) as Record<string, unknown> | undefined;
      const sortOrder = ((maxRow?.max_order as number) ?? -1) + 1;

      db.prepare(
        `INSERT INTO subtasks (id, task_id, name, sort_order)
         VALUES (?, ?, ?, ?)`
      ).run(id, input.taskId, input.name, sortOrder);

      // Update task's updated_at
      db.prepare("UPDATE tasks SET updated_at = ? WHERE id = ?").run(
        new Date().toISOString(),
        input.taskId
      );

      const row = db.prepare("SELECT * FROM subtasks WHERE id = ?").get(id);
      return rowToSubtask(row as Record<string, unknown>);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SUBTASK_UPDATE,
    async (_event, input: UpdateSubtaskInput) => {
      const db = getDatabase();
      const fields: string[] = [];
      const values: unknown[] = [];

      if (input.name !== undefined) {
        fields.push("name = ?");
        values.push(input.name);
      }
      if (input.done !== undefined) {
        fields.push("done = ?");
        values.push(input.done ? 1 : 0);
      }

      if (fields.length === 0) return null;

      values.push(input.id);
      db.prepare(
        `UPDATE subtasks SET ${fields.join(", ")} WHERE id = ?`
      ).run(...values);

      // Update parent task's updated_at
      const subtask = db.prepare("SELECT task_id FROM subtasks WHERE id = ?").get(input.id) as Record<string, unknown> | undefined;
      if (subtask) {
        db.prepare("UPDATE tasks SET updated_at = ? WHERE id = ?").run(
          new Date().toISOString(),
          subtask.task_id
        );
      }

      const row = db.prepare("SELECT * FROM subtasks WHERE id = ?").get(input.id);
      return row ? rowToSubtask(row as Record<string, unknown>) : null;
    }
  );

  ipcMain.handle(IPC_CHANNELS.SUBTASK_DELETE, async (_event, id: string) => {
    const db = getDatabase();

    // Update parent task's updated_at before deleting
    const subtask = db.prepare("SELECT task_id FROM subtasks WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (subtask) {
      db.prepare("UPDATE tasks SET updated_at = ? WHERE id = ?").run(
        new Date().toISOString(),
        subtask.task_id
      );
    }

    db.prepare("DELETE FROM subtasks WHERE id = ?").run(id);
    return { success: true };
  });

  ipcMain.handle(
    IPC_CHANNELS.SUBTASK_REORDER,
    async (_event, taskId: string, subtaskIds: string[]) => {
      const db = getDatabase();
      const stmt = db.prepare("UPDATE subtasks SET sort_order = ? WHERE id = ? AND task_id = ?");

      const updateAll = db.transaction(() => {
        for (let i = 0; i < subtaskIds.length; i++) {
          stmt.run(i, subtaskIds[i], taskId);
        }
      });
      updateAll();

      db.prepare("UPDATE tasks SET updated_at = ? WHERE id = ?").run(
        new Date().toISOString(),
        taskId
      );

      return fetchTaskSubtasks(db, taskId);
    }
  );
}
