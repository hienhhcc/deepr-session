import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabase, closeDatabase } from "./services/database.js";
import { registerProfileHandlers } from "./ipc/profiles.ipc.js";
import { registerSessionHandlers } from "./ipc/sessions.ipc.js";
import { registerTimerHandlers } from "./ipc/timer.ipc.js";
import { registerBlockerHandlers } from "./ipc/blocker.ipc.js";
import { registerAnalyticsHandlers } from "./ipc/analytics.ipc.js";
import { cleanup as cleanupBlocker } from "./services/blocker.service.js";
import { timerService } from "./services/timer.service.js";
import { IPC_CHANNELS } from "../shared/types/ipc.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#f5f0e8",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3456");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/out/index.html"));
  }

  // Minimize to tray instead of closing on macOS
  mainWindow.on("close", (event) => {
    if (process.platform === "darwin" && !app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create a simple 16x16 tray icon
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAALElEQVQ4T2Nk+M/wn4EIwMjIyEiUfgYGBgZGYg1gGDVg1IBhEAZEZyYAAPKCCAFn8YNzAAAAAElFTkSuQmCC"
  );

  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("Deepr Session");

  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;

  const state = timerService.getState();

  const timerStatus =
    state.status === "running"
      ? `Focusing — ${formatSeconds(state.remainingSeconds)}`
      : state.status === "paused"
        ? `Paused — ${formatSeconds(state.remainingSeconds)}`
        : "Idle";

  const contextMenu = Menu.buildFromTemplate([
    { label: "Deepr Session", enabled: false },
    { type: "separator" },
    { label: timerStatus, enabled: false },
    ...(state.status === "running"
      ? [
          {
            label: "Pause",
            click: () => timerService.pause(),
          },
        ]
      : []),
    ...(state.status === "paused"
      ? [
          {
            label: "Resume",
            click: () => timerService.resume(),
          },
        ]
      : []),
    { type: "separator" as const },
    {
      label: "Show Window",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        (app as typeof app & { isQuitting: boolean }).isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function formatSeconds(s: number): string {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function registerAllHandlers() {
  // Initialize database
  getDatabase();

  // Register IPC handlers
  registerProfileHandlers();
  registerSessionHandlers();
  registerTimerHandlers();
  registerBlockerHandlers();
  registerAnalyticsHandlers();

  // App utility handlers
  ipcMain.handle(IPC_CHANNELS.APP_GET_PATH, async (_event, name: string) => {
    return app.getPath(name as Parameters<typeof app.getPath>[0]);
  });
}

// Extend app with isQuitting flag
declare module "electron" {
  interface App {
    isQuitting: boolean;
  }
}
app.isQuitting = false;

app.whenReady().then(() => {
  registerAllHandlers();
  createWindow();
  createTray();

  // Update tray menu periodically to reflect timer state
  setInterval(updateTrayMenu, 2000);

  app.on("activate", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

app.on("will-quit", async () => {
  await cleanupBlocker();
  closeDatabase();
});

export function getMainWindow() {
  return mainWindow;
}
