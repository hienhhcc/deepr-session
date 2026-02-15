"use client";

import { useState, useCallback } from "react";
import {
  Star,
  TreePine,
  Target,
  Clock,
  Pause,
  Play,
  SkipForward,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SessionSetup } from "@/components/timer/session-setup";
import { TimerDisplay } from "@/components/timer/timer-display";
import { useTimer } from "@/hooks/useTimer";
import { useSessionStore } from "@/stores/session.store";
import { formatTime, cn } from "@/lib/utils";

export default function FocusPage() {
  const { status, accumulatedFocusTime, currentPomodoro } = useTimer();
  const { activeSession, endSession } = useSessionStore();

  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [notes, setNotes] = useState("");

  const handleStop = useCallback(() => {
    setShowRating(true);
  }, []);

  const handleSubmitRating = async () => {
    await endSession(rating > 0 ? rating : undefined, notes.trim() || undefined);
    setShowRating(false);
    setRating(0);
    setHoverRating(0);
    setNotes("");
  };

  const handleSkipRating = async () => {
    await endSession();
    setShowRating(false);
    setRating(0);
    setHoverRating(0);
    setNotes("");
  };

  // Show session setup when idle and no active session
  if (!activeSession && status === "idle" && !showRating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <SessionSetup />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="text-center space-y-8">
        {/* Timer */}
        <TimerDisplay />

        {/* Session info */}
        {activeSession && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {activeSession.task}
            </h2>
            {activeSession.intention && (
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {activeSession.intention}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TreePine className="h-3.5 w-3.5" />
                Pomodoro {currentPomodoro}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(accumulatedFocusTime)} focused
              </span>
            </div>
          </div>
        )}

        {/* Controls - wrap stop to show rating */}
        {status !== "idle" && (
          <TimerControlsWithRating onStop={handleStop} />
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Complete</DialogTitle>
            <DialogDescription>
              How was your focus during this session?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Star rating */}
            <div className="space-y-2">
              <Label>Focus Rating</Label>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        (hoverRating || rating) >= star
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="session-notes">Notes (optional)</Label>
              <Textarea
                id="session-notes"
                placeholder="Any reflections on this session?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleSkipRating}>
              Skip
            </Button>
            <Button onClick={handleSubmitRating}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Wrapper that intercepts the stop action to show the rating dialog
 * instead of immediately ending the session.
 */
function TimerControlsWithRating({ onStop }: { onStop: () => void }) {
  const { status, pause, resume, skip, stop } = useTimer();

  const handleStop = async () => {
    await stop();
    onStop();
  };

  if (status === "idle") return null;

  return (
    <div className="flex items-center justify-center gap-3">
      {status === "running" ? (
        <>
          <Button variant="outline" size="lg" onClick={pause} className="gap-2">
            <Pause className="h-5 w-5" />
            Pause
          </Button>
          <Button variant="outline" size="lg" onClick={skip} className="gap-2">
            <SkipForward className="h-5 w-5" />
            Skip
          </Button>
          <Button variant="destructive" size="lg" onClick={handleStop} className="gap-2">
            <Square className="h-5 w-5" />
            Stop
          </Button>
        </>
      ) : (
        <>
          <Button variant="default" size="lg" onClick={resume} className="gap-2">
            <Play className="h-5 w-5" />
            Resume
          </Button>
          <Button variant="destructive" size="lg" onClick={handleStop} className="gap-2">
            <Square className="h-5 w-5" />
            Stop
          </Button>
        </>
      )}
    </div>
  );
}
