"use client";

import { useState, useEffect } from "react";
import {
  TreePine,
  Target,
  Clock,
  Pause,
  Play,
  SkipForward,
  Square,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionSetup } from "@/components/timer/session-setup";
import { TimerDisplay } from "@/components/timer/timer-display";
import { AmbientPlayer } from "@/components/audio/ambient-player";
import { TaskPicker } from "@/components/tasks/task-picker";
import { useTimer } from "@/hooks/useTimer";
import { useSessionStore } from "@/stores/session.store";
import { useAudioStore } from "@/stores/audio.store";
import { formatTime } from "@/lib/utils";

export default function FocusPage() {
  const { status, accumulatedFocusTime, currentPomodoro } = useTimer();
  const { activeSession, endSession } = useSessionStore();

  // Show session setup when idle and no active session
  if (!activeSession && status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <SessionSetup />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="text-center space-y-8 animate-fade-in w-full max-w-lg">
        {/* Timer */}
        <TimerDisplay />

        {/* Session info */}
        {activeSession && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {activeSession.task}
            </h2>
            {activeSession.intention && (
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {activeSession.intention}
              </p>
            )}
            <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <TreePine className="h-3.5 w-3.5 text-primary/60" />
                Pomodoro {currentPomodoro}
              </span>
              <span className="w-px h-3 bg-border" />
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary/60" />
                {formatTime(accumulatedFocusTime)} focused
              </span>
            </div>
          </div>
        )}

        {/* Session tasks */}
        <SessionTaskManager />

        {/* Ambient Sounds */}
        <div className="max-w-md w-full mx-auto">
          <AmbientPlayer />
        </div>

        {/* Controls */}
        {status !== "idle" && (
          <TimerControls onStop={endSession} />
        )}
      </div>
    </div>
  );
}

function SessionTaskManager() {
  const { activeSession, updateSessionTasks } = useSessionStore();
  // Local state drives the visual selection — independent of async IPC
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialise from session when it becomes available (once, on mount / session change)
  useEffect(() => {
    if (activeSession) {
      setSelectedIds((activeSession.tasks ?? []).map((t) => t.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id]);

  if (!activeSession) return null;

  const handleChange = (ids: string[]) => {
    setSelectedIds(ids);          // instant visual feedback
    updateSessionTasks(ids);      // persist in background
  };

  return (
    <div className="max-w-md w-full mx-auto text-left">
      <div className="flex items-center gap-2 mb-2">
        <ListTodo className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tasks
        </span>
      </div>
      <TaskPicker selectedIds={selectedIds} onChange={handleChange} />
    </div>
  );
}

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
          <Button variant="outline" size="lg" onClick={skip} className="gap-2 rounded-xl">
            <SkipForward className="h-5 w-5" />
            Skip
          </Button>
          <Button variant="destructive" size="lg" onClick={handleStop} className="gap-2 rounded-xl">
            <Square className="h-5 w-5" />
            Stop
          </Button>
        </>
      ) : (
        <>
          <Button variant="default" size="lg" onClick={resume} className="gap-2 rounded-xl">
            <Play className="h-5 w-5" />
            Resume
          </Button>
          <Button variant="destructive" size="lg" onClick={handleStop} className="gap-2 rounded-xl">
            <Square className="h-5 w-5" />
            Stop
          </Button>
        </>
      )}
    </div>
  );
}
