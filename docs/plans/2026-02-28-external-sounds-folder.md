# External Sounds Folder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move sound file storage from `renderer/public/sounds/` (in-repo) to `~/Music/deepr-sounds` (user's machine).

**Architecture:** Reroute the existing `app://` protocol handler and IPC scan to read from `os.homedir() + '/Music/deepr-sounds'`. No renderer changes required — `src` paths (`/sounds/filename.mp3`) remain identical. Remove all 21 audio files from the repo.

**Tech Stack:** Electron, Node.js `fs`/`path`/`os` modules, TypeScript

---

### Task 1: Update IPC scan handler to read from external folder

**Files:**
- Modify: `main/ipc/audio.ipc.ts:1-27`

**Step 1: Add `os` import at top of file**

Replace the existing import block (lines 1-5):
```typescript
import { app, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { IPC_CHANNELS } from "../../shared/types/ipc.js";
import { getDatabase } from "../services/database.js";
```

**Step 2: Replace the soundsDir logic in `registerAudioHandlers`**

Replace lines 10-27 (the `AUDIO_SCAN_SOUNDS` handler body):
```typescript
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
```

Note: The old code had separate dev/prod paths. The new code has one path — `~/Music/deepr-sounds` — regardless of environment.

**Step 3: Verify the file looks correct**

Open `main/ipc/audio.ipc.ts` and confirm:
- Line 3: `import os from "node:os";` is present
- Lines 10-27: `soundsDir` is set to `path.join(os.homedir(), "Music", "deepr-sounds")`
- No reference to `app.getAppPath()` or `isDev` in the scan handler

**Step 4: Commit**

```bash
git add main/ipc/audio.ipc.ts
git commit -m "feat: scan sounds from ~/Music/deepr-sounds instead of bundled folder"
```

---

### Task 2: Update protocol handler to serve audio from external folder

**Files:**
- Modify: `main/index.ts:207-260`

The current `app://` handler resolves ALL paths (including `/sounds/*`) against `outDir` (the bundled app output). We need to intercept `/sounds/` requests and redirect them to `~/Music/deepr-sounds/`.

**Step 1: Add `os` import to `main/index.ts`**

Check line 2-3 of `main/index.ts` — it already imports `path` and `fs`. Add `os`:
```typescript
import os from "node:os";
```

Place it after the existing `import fs from "node:fs";` line.

**Step 2: Add `soundsDir` constant just before the `app.whenReady()` block**

Find the line `app.isQuitting = false;` (around line 176). Just below it, before `protocol.registerSchemesAsPrivileged(...)`, add:
```typescript
const EXTERNAL_SOUNDS_DIR = path.join(os.homedir(), "Music", "deepr-sounds");
```

**Step 3: Update the protocol handler to intercept `/sounds/` paths**

Inside `session.defaultSession.protocol.handle('app', (request) => { ... })`, the handler currently builds `candidates` from `outDir`. Add a check at the top of the handler callback (right after `if (pathname === '/' || pathname === '') pathname = '/index.html';`):

```typescript
// Serve audio files from the external sounds folder
if (pathname.startsWith('/sounds/')) {
  const filename = path.basename(pathname);
  const filePath = path.join(EXTERNAL_SOUNDS_DIR, filename);

  try {
    const contentType = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    const stat = fs.statSync(filePath);
    const totalSize = stat.size;

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
  } catch {
    return new Response(null, { status: 404 });
  }
}
```

The full handler flow after this change:
1. If pathname starts with `/sounds/` → read from `~/Music/deepr-sounds/` → return file or 404
2. Otherwise → existing logic (resolve against `outDir`)

**Step 4: Verify the handler structure**

The protocol handler should now look like:
```typescript
session.defaultSession.protocol.handle('app', (request) => {
  let { pathname } = new URL(request.url);
  if (pathname === '/' || pathname === '') pathname = '/index.html';

  // NEW: external sounds
  if (pathname.startsWith('/sounds/')) {
    // ... external sounds logic
  }

  // EXISTING: app static files
  const candidates = [ ... ];
  // ...
});
```

**Step 5: Commit**

```bash
git add main/index.ts
git commit -m "feat: serve /sounds/* from ~/Music/deepr-sounds via app:// protocol"
```

---

### Task 3: Remove sound files from repository

**Files:**
- Delete: `renderer/public/sounds/*.mp3` (21 files)

**Step 1: Delete all audio files from the sounds directory**

```bash
rm renderer/public/sounds/*.mp3 renderer/public/sounds/*.ogg renderer/public/sounds/*.wav 2>/dev/null || true
```

**Step 2: Verify only audio files were deleted (directory itself can remain)**

```bash
ls renderer/public/sounds/
```

Expected: empty directory or "No such file or directory" — no `.mp3`/`.ogg`/`.wav` files.

**Step 3: Stage deletions and commit**

```bash
git add -u renderer/public/sounds/
git commit -m "chore: remove bundled audio files (sounds now loaded from ~/Music/deepr-sounds)"
```

---

### Task 4: Manual smoke test

**Step 1: Create the external sounds folder and add a test file**

```bash
mkdir -p ~/Music/deepr-sounds
cp /path/to/any/audio.mp3 ~/Music/deepr-sounds/test.mp3
```

**Step 2: Run the app**

```bash
npx electron .
```

**Step 3: Verify sounds are detected**

1. Open the app → navigate to Sounds page
2. Click "Rescan" button
3. `test.mp3` should appear in the list

**Step 4: Verify playback**

1. Click the preview button on `test.mp3`
2. Audio should play from `~/Music/deepr-sounds/test.mp3`

**Step 5: Verify empty folder behavior**

1. Remove the test file: `rm ~/Music/deepr-sounds/test.mp3`
2. Click "Rescan" in the app
3. The sounds list should be empty — no crash
