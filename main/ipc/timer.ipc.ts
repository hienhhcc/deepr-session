import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import { timerService } from "../services/timer.service.js";
import { getDatabase } from "../services/database.js";

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

      return timerService.getState();
    }
  );

  ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, async () => {
    timerService.pause();
    return timerService.getState();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_RESUME, async () => {
    timerService.resume();
    return timerService.getState();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_STOP, async () => {
    timerService.stop();
    return timerService.getState();
  });

  ipcMain.handle(IPC_CHANNELS.TIMER_SKIP, async () => {
    timerService.skip();
    return timerService.getState();
  });
}
