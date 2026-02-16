"use client";

import { useState, useEffect } from "react";
import { Play, TreePine, Leaf } from "lucide-react";
import { getElectronAPI } from "@/lib/electron-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskPicker } from "@/components/tasks/task-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionStore } from "@/stores/session.store";
import { useTimer } from "@/hooks/useTimer";

interface Profile {
  id: string;
  name: string;
  focusDuration?: number;
  breakDuration?: number;
  longBreakDuration?: number;
  sessionsBeforeLongBreak?: number;
}

const DEFAULTS = {
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export function SessionSetup() {
  const { createSession, loading } = useSessionStore();
  const { start } = useTimer();

  const [task, setTask] = useState("");
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [intention, setIntention] = useState("");
  const [profileId, setProfileId] = useState<string>("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [focusDuration, setFocusDuration] = useState(DEFAULTS.focusDuration);
  const [breakDuration, setBreakDuration] = useState(DEFAULTS.breakDuration);
  const [longBreakDuration, setLongBreakDuration] = useState(DEFAULTS.longBreakDuration);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(
    DEFAULTS.sessionsBeforeLongBreak
  );

  useEffect(() => {
    const api = getElectronAPI();
    if (!api) return;
    api.profile.list().then((list) => {
      if (list) setProfiles(list);
    });
  }, []);

  const handleProfileChange = (value: string) => {
    setProfileId(value);
    if (value === "custom") {
      setFocusDuration(DEFAULTS.focusDuration);
      setBreakDuration(DEFAULTS.breakDuration);
      setLongBreakDuration(DEFAULTS.longBreakDuration);
      setSessionsBeforeLongBreak(DEFAULTS.sessionsBeforeLongBreak);
      return;
    }
    const profile = profiles.find((p) => p.id === value);
    if (profile) {
      setFocusDuration(profile.focusDuration ?? DEFAULTS.focusDuration);
      setBreakDuration(profile.breakDuration ?? DEFAULTS.breakDuration);
      setLongBreakDuration(profile.longBreakDuration ?? DEFAULTS.longBreakDuration);
      setSessionsBeforeLongBreak(
        profile.sessionsBeforeLongBreak ?? DEFAULTS.sessionsBeforeLongBreak
      );
    }
  };

  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!task.trim() && taskIds.length === 0) return;
    setError(null);

    try {
      const session = await createSession({
        task: task.trim() || "Focus session",
        intention: intention.trim() || undefined,
        profileId: profileId && profileId !== "custom" ? profileId : undefined,
        focusDuration,
        breakDuration,
        longBreakDuration,
        sessionsBeforeLongBreak,
        taskIds: taskIds.length > 0 ? taskIds : undefined,
      });

      if (!session) {
        setError("Failed to create session. Check the developer console for details.");
        return;
      }

      await start(session.id);
    } catch (err) {
      console.error("Failed to start session:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mx-auto mb-1">
          <TreePine className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">New Focus Session</h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Set your intention and begin your focused work.
        </p>
      </div>

      <div className="space-y-5">
        {/* Tasks */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tasks *
          </Label>
          <TaskPicker selectedIds={taskIds} onChange={setTaskIds} />
          <Input
            placeholder="Or type a quick task name..."
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="h-10 text-sm"
          />
        </div>

        {/* Intention */}
        <div className="space-y-2">
          <Label htmlFor="intention" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Intention <span className="font-normal normal-case tracking-normal">(optional)</span>
          </Label>
          <Textarea
            id="intention"
            placeholder="What do you want to accomplish?"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            rows={2}
          />
        </div>

        {/* Profile selector */}
        {profiles.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Profile
            </Label>
            <Select value={profileId} onValueChange={handleProfileChange}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select a profile or customize" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Duration inputs */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Duration
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">Focus (min)</span>
              <Input
                id="focus"
                type="number"
                min={1}
                max={120}
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">Break (min)</span>
              <Input
                id="break"
                type="number"
                min={1}
                max={60}
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">Long Break (min)</span>
              <Input
                id="longBreak"
                type="number"
                min={1}
                max={60}
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground">Sessions before long break</span>
              <Input
                id="sessions"
                type="number"
                min={1}
                max={10}
                value={sessionsBeforeLongBreak}
                onChange={(e) => setSessionsBeforeLongBreak(Number(e.target.value))}
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive text-center bg-destructive/5 rounded-lg py-2 px-3">
            {error}
          </p>
        )}

        {/* Start button */}
        <Button
          className="w-full gap-2.5 text-base py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
          size="lg"
          onClick={handleStart}
          disabled={(!task.trim() && taskIds.length === 0) || loading}
        >
          <Play className="h-5 w-5" />
          {loading ? "Starting..." : "Start Session"}
        </Button>
      </div>

      {/* Nature quote */}
      <div className="text-center pt-8">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Leaf className="h-3 w-3 text-primary/30" />
        </div>
        <p className="text-[13px] text-muted-foreground/60 italic font-serif leading-relaxed">
          "The clearest way into the Universe is through a forest wilderness."
        </p>
        <p className="text-[11px] text-muted-foreground/40 mt-1.5 font-medium tracking-wide">
          John Muir
        </p>
      </div>
    </div>
  );
}
