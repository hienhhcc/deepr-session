import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import { timerService } from "../services/timer.service.js";
import { getDatabase } from "../services/database.js";
import { startBlocking, stopBlocking, DEFAULT_BLOCKED_DOMAINS, DEFAULT_BLOCKED_APPS } from "../services/blocker.service.js";

export function registerTimerHandlers() {
  ipcMain.handle(
    IPC_CHANNELS.TIMER_START,
    async (_event, sessionId: string) => {
      const db = getDatabase();
      const row = db
        .prepare("SELECT * FROM sessions WHERE id = ?")
        .get(sessionId) as Record<string, unknown> | undefined;

      if (!row) throw new Error("Session not found");

      timerService.start(
        sessionId,
        row.focus_duration as number,
        row.break_duration as number,
        row.long_break_duration as number,
        row.sessions_before_long_break as number
      );

      // Start blocking distractors
      try {
        await startBlocking(DEFAULT_BLOCKED_DOMAINS, DEFAULT_BLOCKED_APPS);
      } catch (error) {
        console.error("Failed to start blocker (user may have denied sudo):", error);
      }

      return timerService.getState();
    }
  );

  ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, async () => {
    timerService.pause();

    // Unblock distractors while paused
    try {
      await stopBlocking();
    } catch (error) {
      console.error("Failed to stop blocker on pause:", error);
    }

    return timerService.getState();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_RESUME, async () => {
    timerService.resume();

    // Re-block distractors on resume
    try {
      await startBlocking(DEFAULT_BLOCKED_DOMAINS, DEFAULT_BLOCKED_APPS);
    } catch (error) {
      console.error("Failed to start blocker on resume:", error);
    }

    return timerService.getState();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_STOP, async () => {
    // Stop blocking before stopping timer
    try {
      await stopBlocking();
    } catch (error) {
      console.error("Failed to stop blocker:", error);
    }

    timerService.stop();
    return timerService.getState();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_SKIP, async () => {
    timerService.skip();
    return timerService.getState();
  });
}
