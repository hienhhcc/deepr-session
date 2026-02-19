"use client";

import { useState, useEffect } from "react";
import { Play, TreePine, Leaf } from "lucide-react";
import { getElectronAPI } from "@/lib/electron-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TaskPicker } from "@/components/tasks/task-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionStore } from "@/stores/session.store";
import { useAudioStore, type SoundPreset } from "@/stores/audio.store";
import { useTimer } from "@/hooks/useTimer";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
  focusDuration?: number;
  soundPreset?: string;
}

const DURATION_PRESETS = [
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "8h", minutes: 480 },
];

const FOCUS_PER_CYCLE = 55;
const BREAK_PER_CYCLE = 5;

export function SessionSetup() {
  const { createSession, loading } = useSessionStore();
  const { start } = useTimer();

  const [task, setTask] = useState("");
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalDuration, setTotalDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isProfileSelected = !!profileId && profileId !== "custom";

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
      setTotalDuration(60);
      setIsCustom(false);
      setCustomDuration("");
      return;
    }
    const profile = profiles.find((p) => p.id === value);
    if (profile) {
      setTotalDuration(profile.focusDuration ?? 60);
      setIsCustom(false);
      setCustomDuration("");
    }
  };

  const handlePresetClick = (minutes: number) => {
    setTotalDuration(minutes);
    setIsCustom(false);
    setCustomDuration("");
  };

  const handleCustomFocus = () => {
    setIsCustom(true);
    setCustomDuration(String(totalDuration));
  };

  const handleCustomChange = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setCustomDuration(value);
      if (value !== "") {
        const num = parseInt(value, 10);
        if (num > 0) setTotalDuration(num);
      }
    }
  };

  const handleCustomBlur = () => {
    if (!customDuration || parseInt(customDuration, 10) <= 0) {
      setCustomDuration("");
      setIsCustom(false);
      setTotalDuration(60);
    }
  };

  const isPresetSelected = (minutes: number) => !isCustom && totalDuration === minutes;

  const handleStart = async () => {
    setError(null);
    try {
      const session = await createSession({
        task: task.trim() || "Focus session",
        profileId: isProfileSelected ? profileId : undefined,
        focusDuration: FOCUS_PER_CYCLE,
        breakDuration: BREAK_PER_CYCLE,
        longBreakDuration: BREAK_PER_CYCLE,
        sessionsBeforeLongBreak: 999,
        taskIds: taskIds.length > 0 ? taskIds : undefined,
      });

      if (!session) {
        setError("Failed to create session. Check the developer console for details.");
        return;
      }

      // Auto-apply sound preset from profile
      if (isProfileSelected) {
        const profile = profiles.find((p) => p.id === profileId);
        if (profile?.soundPreset) {
          try {
            const preset = JSON.parse(profile.soundPreset) as SoundPreset;
            useAudioStore.getState().applyPreset(preset);
          } catch {
            // Invalid preset JSON, skip
          }
        }
      }

      await start(session.id);
    } catch (err) {
      console.error("Failed to start session:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    }
  };

  const cycles = Math.floor(totalDuration / 60);
  const remainder = totalDuration % 60;
  const breaks = cycles > 0 ? (remainder > 0 ? cycles : cycles - 1) : 0;

  const formatDurationLabel = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
        {/* Profile selector — always on top */}
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

        {/* Tasks — hidden when a real profile is selected */}
        {!isProfileSelected && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tasks <span className="font-normal normal-case tracking-normal">(optional)</span>
            </Label>
            <TaskPicker selectedIds={taskIds} onChange={setTaskIds} />
            <Input
              placeholder="Or type a quick task name..."
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
        )}

        {/* Duration — hidden when a real profile is selected */}
        {!isProfileSelected && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Session Duration
            </Label>

            <div className="flex gap-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  type="button"
                  onClick={() => handlePresetClick(preset.minutes)}
                  className={cn(
                    "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150",
                    isPresetSelected(preset.minutes)
                      ? "bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/20"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleCustomFocus}
                className={cn(
                  "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all duration-150",
                  isCustom
                    ? "bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/20"
                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                Custom
              </button>
            </div>

            {isCustom && (
              <div className="flex items-center gap-2">
                <Input
                  value={customDuration}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  onBlur={handleCustomBlur}
                  placeholder="Minutes"
                  className="h-10 w-28"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground/70">
              {formatDurationLabel(totalDuration)} total
              {breaks > 0 && ` · ${breaks} short break${breaks > 1 ? "s" : ""} (${BREAK_PER_CYCLE} min each)`}
            </p>
          </div>
        )}

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
          disabled={loading}
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
