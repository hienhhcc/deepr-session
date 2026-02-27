# Task Expansion + Pause/Resume Behavior Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show full task title when expanded with subtasks checklist (Things 3 style), and pause music + unblock distractors when session is paused.

**Architecture:** Three independent changes: (1) CSS-only change in `SortableTaskCard` to allow title wrapping when expanded, (2) add `stopBlocking`/`startBlocking` calls to pause/resume IPC handlers in main process, (3) add audio pause/resume logic to `TimerControls` in renderer.

**Tech Stack:** Electron, React, Zustand, Tailwind CSS

---

### Task 1: Full title wrapping when task is expanded

**Files:**
- Modify: `renderer/app/page.tsx:337-364`

**Step 1: Update the expanded title to show full text with wrapping**

Currently when expanded (line 337-342), the `InlineEdit` component is used. It renders an `<input>` which is single-line and won't wrap. Replace it with the `multiline` variant or just display the full title as a wrapping `<span>` that's editable on click.

The simpler approach: keep `InlineEdit` for editing, but the expanded non-editing state should show a wrapping title. However, the current code shows `InlineEdit` immediately when expanded. Let's keep the `InlineEdit` but switch it to `multiline` mode so the title wraps in a textarea:

In `renderer/app/page.tsx`, change lines 337-342 from:

```tsx
{isExpanded ? (
  <InlineEdit
    value={task.name}
    onSave={(name) => updateTask({ id: task.id, name })}
    className="flex-1 min-w-0 text-sm"
  />
) : (
```

To:

```tsx
{isExpanded ? (
  <InlineEdit
    value={task.name}
    onSave={(name) => updateTask({ id: task.id, name })}
    className="flex-1 min-w-0 text-sm"
    multiline
  />
) : (
```

**Step 2: Verify the multiline InlineEdit renders a textarea that wraps**

The `InlineEdit` component (lines 470-490) already has a `multiline` mode that renders a `<textarea>`. Check that it auto-sizes properly. The existing textarea code:

```tsx
if (multiline) {
  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      ...
    />
  );
}
```

Ensure the textarea has auto-height. If it doesn't, add `rows={1}` and auto-resize behavior. Read the full textarea code to confirm.

**Step 3: Verify collapsed state still truncates**

The collapsed state (lines 344-364) already uses `truncate` on the `<span>`. No change needed there.

**Step 4: Commit**

```bash
git add renderer/app/page.tsx
git commit -m "feat: show full task title when expanded with text wrapping"
```

---

### Task 2: Pause/resume distractors on session pause/resume

**Files:**
- Modify: `main/ipc/timer.ipc.ts:37-45`

**Step 1: Add stopBlocking to TIMER_PAUSE handler**

Change lines 37-40 from:

```typescript
ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, async () => {
  timerService.pause();
  return timerService.getState();
});
```

To:

```typescript
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
```

**Step 2: Add startBlocking to TIMER_RESUME handler**

Change lines 42-45 from:

```typescript
ipcMain.handle(IPC_CHANNELS.TIMER_RESUME, async () => {
  timerService.resume();
  return timerService.getState();
});
```

To:

```typescript
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
```

**Step 3: Commit**

```bash
git add main/ipc/timer.ipc.ts
git commit -m "feat: unblock distractors on pause, re-block on resume"
```

---

### Task 3: Pause/resume music on session pause/resume

**Files:**
- Modify: `renderer/app/page.tsx:573-615` (TimerControls component)

**Step 1: Add audio pause/resume logic to TimerControls**

The `TimerControls` component directly calls `pause()` and `resume()` from `useTimer()`. We need to also pause/resume audio. Add audio store calls inline:

Change the TimerControls component from:

```tsx
function TimerControls({ onStop }: { onStop: () => Promise<void> }) {
  const { status, pause, resume, skip, stop } = useTimer();

  const handleStop = async () => {
    useAudioStore.getState().stop();
    await stop();
    await onStop();
  };

  if (status === "idle") return null;

  return (
    <div className="flex items-center justify-center gap-3 animate-fade-in-up">
      {status === "running" ? (
        <>
          <Button variant="outline" size="lg" onClick={pause} className="gap-2 rounded-xl">
            <Pause className="h-5 w-5" />
            Pause
          </Button>
```

To:

```tsx
function TimerControls({ onStop }: { onStop: () => Promise<void> }) {
  const { status, pause, resume, skip, stop } = useTimer();
  const wasAudioPlayingRef = useRef(false);

  const handlePause = async () => {
    // Remember if audio was playing before pause
    const audioState = useAudioStore.getState();
    wasAudioPlayingRef.current = audioState.isEnabled && !audioState.isPaused;
    if (wasAudioPlayingRef.current) {
      audioState.pause();
    }
    await pause();
  };

  const handleResume = async () => {
    await resume();
    // Resume audio if it was playing before pause
    if (wasAudioPlayingRef.current) {
      useAudioStore.getState().resume();
      wasAudioPlayingRef.current = false;
    }
  };

  const handleStop = async () => {
    wasAudioPlayingRef.current = false;
    useAudioStore.getState().stop();
    await stop();
    await onStop();
  };

  if (status === "idle") return null;

  return (
    <div className="flex items-center justify-center gap-3 animate-fade-in-up">
      {status === "running" ? (
        <>
          <Button variant="outline" size="lg" onClick={handlePause} className="gap-2 rounded-xl">
            <Pause className="h-5 w-5" />
            Pause
          </Button>
```

Also update the Resume button to use `handleResume`:

```tsx
          <Button variant="default" size="lg" onClick={handleResume} className="gap-2 rounded-xl">
            <Play className="h-5 w-5" />
            Resume
          </Button>
```

**Step 2: Ensure `useRef` is imported**

Check that `useRef` is in the React import at the top of the file. If not, add it.

**Step 3: Commit**

```bash
git add renderer/app/page.tsx
git commit -m "feat: pause/resume music with session pause/resume"
```
