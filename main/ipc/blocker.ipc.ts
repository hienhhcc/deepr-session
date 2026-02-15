import { ipcMain } from "electron";
import crypto from "node:crypto";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import { getDatabase } from "../services/database.js";
import {
  startBlocking,
  stopBlocking,
  getStatus,
} from "../services/blocker.service.js";

export function registerBlockerHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.BLOCKER_START,
    async (_event, domains: string[], apps: string[]) => {
      await startBlocking(domains, apps);
      return getStatus();
    }
  );

  ipcMain.handle(IPC_CHANNELS.BLOCKER_STOP, async () => {
    await stopBlocking();
    return getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.BLOCKER_STATUS, async () => {
    return getStatus();
  });

  ipcMain.handle(
    IPC_CHANNELS.BLOCKER_ADD_RULE,
    async (
      _event,
      input: { profileId: string; type: "domain" | "app"; value: string }
    ) => {
      const db = getDatabase();
      const id = crypto.randomUUID();
      db.prepare(
        "INSERT INTO block_rules (id, profile_id, type, value) VALUES (?, ?, ?, ?)"
      ).run(id, input.profileId, input.type, input.value);

      return db
        .prepare("SELECT * FROM block_rules WHERE id = ?")
        .get(id);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.BLOCKER_REMOVE_RULE,
    async (_event, id: string) => {
      const db = getDatabase();
      db.prepare("DELETE FROM block_rules WHERE id = ?").run(id);
      return { success: true };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.BLOCKER_LIST_RULES,
    async (_event, profileId: string) => {
      const db = getDatabase();
      return db
        .prepare(
          "SELECT * FROM block_rules WHERE profile_id = ? ORDER BY created_at DESC"
        )
        .all(profileId);
    }
  );
}
