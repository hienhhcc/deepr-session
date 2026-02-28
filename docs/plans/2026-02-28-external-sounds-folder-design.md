# External Sounds Folder Design

**Date:** 2026-02-28
**Status:** Approved

## Problem

Sound files are currently stored in the Git repository under `renderer/public/sounds/`, tracked with Git LFS. This couples large binary assets to source control, inflating repo size and requiring LFS for all contributors.

## Solution

Move sounds to a fixed location on the user's machine: `~/Music/deepr-sounds`. The app reads from this folder at runtime.

## Architecture

### Approach

Reroute the existing `app://` protocol handler and IPC scan path to read from `~/Music/deepr-sounds`. No renderer changes required — `src` paths (`/sounds/filename.mp3`) remain identical.

### Files Changed

1. **`main/ipc/audio.ipc.ts`**
   - Change sounds directory resolution from app-relative path to `os.homedir() + '/Music/deepr-sounds'`
   - If folder doesn't exist, return `[]` (same silent-fail behavior)

2. **`index.ts`** (main process protocol handler)
   - Change `/sounds/*` file serving to read from `~/Music/deepr-sounds/` instead of the bundled app directory
   - Range requests (206 Partial Content) and MIME types unchanged

3. **`renderer/public/sounds/`**
   - Delete all audio files from the repository

### No Changes Needed

- Audio store (`audio.store.ts`) — src format unchanged
- UI components — no updates required
- Howler playback setup — unaffected
- Database (playlists) — unaffected

## Edge Cases

| Scenario | Behavior |
|---|---|
| `~/Music/deepr-sounds` doesn't exist | Scan returns `[]`, player shows empty |
| Requested file not found | Protocol handler returns 404 |
| Folder exists but empty | Same as above |

## Out of Scope

- Auto-creating `~/Music/deepr-sounds` on first launch
- UI for configuring the sounds folder path
- Migrating existing sounds for the user

## User Instructions

After this change, users must:
1. Create `~/Music/deepr-sounds` manually
2. Place `.mp3`, `.ogg`, or `.wav` files in that folder
3. Click "Rescan" in the app's Sounds page (or restart the app)
