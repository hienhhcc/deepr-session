import { ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import { getDatabase } from "../services/database.js";

const AUDIO_EXTENSIONS = new Set([".mp3", ".ogg", ".wav"]);

export function registerAudioHandlers() {
  ipcMain.handle(IPC_CHANNELS.AUDIO_SCAN_SOUNDS, async () => {
    const soundsDir = path.join(os.homedir(), "Music", "deepr-sounds");

    try {
      const entries = fs.readdirSync(soundsDir, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && AUDIO_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
        .map((e) => ({
          filename: e.name,
          src: `/sounds/${e.name}`,
        }));
    } catch {
      return [];
    }
  });

  // --- Playlist handlers ---

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_LIST, () => {
    const db = getDatabase();
    const playlists = db
      .prepare("SELECT id, name, created_at FROM playlists ORDER BY created_at")
      .all() as { id: string; name: string; created_at: string }[];

    const itemStmt = db.prepare(
      "SELECT sound_id FROM playlist_items WHERE playlist_id = ? ORDER BY sort_order"
    );

    return playlists.map((p) => ({
      id: p.id,
      name: p.name,
      soundIds: (itemStmt.all(p.id) as { sound_id: string }[]).map(
        (r) => r.sound_id
      ),
    }));
  });

  ipcMain.handle(
    IPC_CHANNELS.PLAYLIST_CREATE,
    (_event, input: { id: string; name: string; soundIds: string[] }) => {
      const db = getDatabase();
      const insertPlaylist = db.prepare(
        "INSERT INTO playlists (id, name) VALUES (?, ?)"
      );
      const insertItem = db.prepare(
        "INSERT INTO playlist_items (playlist_id, sound_id, sort_order) VALUES (?, ?, ?)"
      );

      const run = db.transaction(() => {
        insertPlaylist.run(input.id, input.name);
        for (let i = 0; i < input.soundIds.length; i++) {
          insertItem.run(input.id, input.soundIds[i], i);
        }
      });
      run();
      return { id: input.id };
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PLAYLIST_UPDATE,
    (
      _event,
      input: { id: string; name?: string; soundIds?: string[] }
    ) => {
      const db = getDatabase();

      const run = db.transaction(() => {
        if (input.name !== undefined) {
          db.prepare("UPDATE playlists SET name = ? WHERE id = ?").run(
            input.name,
            input.id
          );
        }
        if (input.soundIds !== undefined) {
          db.prepare(
            "DELETE FROM playlist_items WHERE playlist_id = ?"
          ).run(input.id);
          const insertItem = db.prepare(
            "INSERT INTO playlist_items (playlist_id, sound_id, sort_order) VALUES (?, ?, ?)"
          );
          for (let i = 0; i < input.soundIds.length; i++) {
            insertItem.run(input.id, input.soundIds[i], i);
          }
        }
      });
      run();
    }
  );

  ipcMain.handle(IPC_CHANNELS.PLAYLIST_DELETE, (_event, id: string) => {
    const db = getDatabase();
    db.prepare("DELETE FROM playlists WHERE id = ?").run(id);
  });
}
