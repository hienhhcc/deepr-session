import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, protocol, session } from "electron";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { getDatabase, closeDatabase } from "./services/database.js";
import { registerProfileHandlers } from "./ipc/profiles.ipc.js";
import { registerSessionHandlers } from "./ipc/sessions.ipc.js";
import { registerTimerHandlers } from "./ipc/timer.ipc.js";
import { registerBlockerHandlers } from "./ipc/blocker.ipc.js";
import { registerAnalyticsHandlers } from "./ipc/analytics.ipc.js";
import { registerTaskHandlers } from "./ipc/tasks.ipc.js";
import { registerAudioHandlers } from "./ipc/audio.ipc.js";
import { cleanup as cleanupBlocker, setupSudoless, startupCleanup as blockerStartupCleanup } from "./services/blocker.service.js";
import { timerService } from "./services/timer.service.js";
import { IPC_CHANNELS } from "../shared/types/ipc.js";

console.log("[deepr] Main process starting...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log("[deepr] __dirname:", __dirname);

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");
  console.log("[deepr] Preload path:", preloadPath);
  console.log("[deepr] Preload exists:", fs.existsSync(preloadPath));

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: "#f5f0e8",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3456");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadURL("app://./index.html");
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

  // Dev keyboard shortcuts
  mainWindow.webContents.on("before-input-event", (_event, input) => {
    if (input.meta && input.alt && input.key === "i") {
      mainWindow?.webContents.toggleDevTools();
    }
    // Cmd+R to reload in dev
    if (isDev && input.meta && !input.alt && !input.shift && input.key === "r") {
      mainWindow?.webContents.reload();
    }
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
  registerTaskHandlers();
  registerAudioHandlers();

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
const EXTERNAL_SOUNDS_DIR = path.join(os.homedir(), "Music", "deepr-sounds");

// Must be called before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true } },
]);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.cjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
};

app.whenReady().then(() => {
  // Serve renderer static files via app:// so client-side navigation
  // always resolves assets relative to the correct base, regardless of route.
  const outDir = path.join(app.getAppPath(), 'renderer', 'out');
  session.defaultSession.protocol.handle('app', (request) => {
    let { pathname } = new URL(request.url);
    if (pathname === '/' || pathname === '') pathname = '/index.html';

    // Serve audio files from the external sounds folder
    if (pathname.startsWith('/sounds/')) {
      const filename = path.basename(pathname);
      const audioFilePath = path.join(EXTERNAL_SOUNDS_DIR, filename);

      try {
        const contentType = MIME[path.extname(audioFilePath).toLowerCase()] ?? 'application/octet-stream';
        const stat = fs.statSync(audioFilePath);
        const totalSize = stat.size;

        const rangeHeader = request.headers.get('range');
        if (rangeHeader) {
          const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
          if (match) {
            const start = parseInt(match[1], 10);
            const end = match[2] ? Math.min(parseInt(match[2], 10), totalSize - 1) : totalSize - 1;
            if (start > end || start < 0) {
              return new Response(null, {
                status: 416,
                headers: { 'content-range': `bytes */${totalSize}` },
              });
            }
            const chunkSize = end - start + 1;
            const buf = Buffer.alloc(chunkSize);
            const fd = fs.openSync(audioFilePath, 'r');
            try {
              fs.readSync(fd, buf, 0, chunkSize, start);
            } finally {
              fs.closeSync(fd);
            }
            return new Response(buf, {
              status: 206,
              headers: {
                'content-type': contentType,
                'content-range': `bytes ${start}-${end}/${totalSize}`,
                'content-length': String(chunkSize),
                'accept-ranges': 'bytes',
              },
            });
          }
        }

        const content = fs.readFileSync(audioFilePath);
        return new Response(content, {
          headers: {
            'content-type': contentType,
            'content-length': String(totalSize),
            'accept-ranges': 'bytes',
          },
        });
      } catch {
        return new Response(null, { status: 404 });
      }
    }

    const candidates = [
      path.join(outDir, pathname),
      path.join(outDir, pathname + '.html'),
      path.join(outDir, pathname, 'index.html'),
    ];

    let filePath = path.join(outDir, 'index.html');
    for (const candidate of candidates) {
      try {
        if (fs.statSync(candidate).isFile()) { filePath = candidate; break; }
      } catch { /* not found, try next */ }
    }

    const contentType = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const totalSize = stat.size;

    // Support Range requests (required for HTML5 <audio>/<video> streaming)
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;
        const chunkSize = end - start + 1;
        const buf = Buffer.alloc(chunkSize);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buf, 0, chunkSize, start);
        fs.closeSync(fd);
        return new Response(buf, {
          status: 206,
          headers: {
            'content-type': contentType,
            'content-range': `bytes ${start}-${end}/${totalSize}`,
            'content-length': String(chunkSize),
            'accept-ranges': 'bytes',
          },
        });
      }
    }

    const content = fs.readFileSync(filePath);
    return new Response(content, {
      headers: {
        'content-type': contentType,
        'content-length': String(totalSize),
        'accept-ranges': 'bytes',
      },
    });
  });

  // Set dock icon (dev mode — packaged builds use electron-builder icon)
  if (isDev && process.platform === 'darwin') {
    const devIconPath = path.join(__dirname, '../../app-icon/icon.icns');
    if (fs.existsSync(devIconPath)) {
      app.dock.setIcon(devIconPath);
    }
  }

  try {
    registerAllHandlers();
    console.log("[deepr] All IPC handlers registered");
  } catch (err) {
    console.error("[deepr] FATAL: Failed to register handlers:", err);
  }

  // Remove any leftover block entries from a previous crash/force-kill
  blockerStartupCleanup().catch((err) => {
    console.warn("[deepr] Blocker startup cleanup failed:", err);
  });

  // Set up passwordless blocker (one-time sudo prompt, then never again)
  setupSudoless().catch((err) => {
    console.warn("[deepr] Sudoless blocker setup skipped (user may have denied):", err);
  });

  try {
    createWindow();
    console.log("[deepr] Window created");

    // Listen for preload errors
    mainWindow?.webContents.on("preload-error" as any, (_event: any, preloadPath: string, error: Error) => {
      console.error("[deepr] Preload error at", preloadPath, ":", error);
    });
  } catch (err) {
    console.error("[deepr] FATAL: Failed to create window:", err);
  }

  try {
    createTray();
  } catch (err) {
    console.error("[deepr] Failed to create tray:", err);
  }

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

let cleanupDone = false;
app.on("will-quit", (event) => {
  if (cleanupDone) return;
  event.preventDefault();
  cleanupBlocker()
    .catch((err) => console.error("[deepr] Blocker cleanup failed:", err))
    .finally(() => {
      closeDatabase();
      cleanupDone = true;
      app.quit();
    });
});

export function getMainWindow() {
  return mainWindow;
}
