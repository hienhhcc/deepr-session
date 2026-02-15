"use client";

import { Pause, Play, SkipForward, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/hooks/useTimer";

export function TimerControls() {
  const { status, pause, resume, stop, skip } = useTimer();

  if (status === "idle") {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {status === "running" ? (
        <>
          <Button
            variant="outline"
            size="lg"
            onClick={pause}
            className="gap-2"
          >
            <Pause className="h-5 w-5" />
            Pause
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={skip}
            className="gap-2"
          >
            <SkipForward className="h-5 w-5" />
            Skip
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={stop}
            className="gap-2"
          >
            <Square className="h-5 w-5" />
            Stop
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="default"
            size="lg"
            onClick={resume}
            className="gap-2"
          >
            <Play className="h-5 w-5" />
            Resume
          </Button>
          <Button
            variant="destructive"
            size="lg"
            onClick={stop}
            className="gap-2"
          >
            <Square className="h-5 w-5" />
            Stop
          </Button>
        </>
      )}
    </div>
  );
}
