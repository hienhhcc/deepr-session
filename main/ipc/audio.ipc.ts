import { app, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";

const AUDIO_EXTENSIONS = new Set([".mp3", ".ogg", ".wav"]);

export function registerAudioHandlers() {
  ipcMain.handle(IPC_CHANNELS.AUDIO_SCAN_SOUNDS, async () => {
    const isDev = !app.isPackaged;
    const soundsDir = isDev
      ? path.join(app.getAppPath(), "renderer", "public", "sounds")
      : path.join(app.getAppPath(), "renderer", "out", "sounds");

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
}
