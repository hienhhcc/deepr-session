"use client";

import { useState, useEffect } from "react";
import { Play, TreePine } from "lucide-react";
import { getElectronAPI } from "@/lib/electron-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  const handleStart = async () => {
    if (!task.trim()) return;

    const session = await createSession({
      task: task.trim(),
      intention: intention.trim() || undefined,
      profileId: profileId && profileId !== "custom" ? profileId : undefined,
      focusDuration,
      breakDuration,
      longBreakDuration,
      sessionsBeforeLongBreak,
    });

    if (session) {
      await start(session.id);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <TreePine className="h-6 w-6" />
          <h2 className="text-xl font-semibold">New Focus Session</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Set your intention and begin your focused work.
        </p>
      </div>

      <div className="space-y-4">
        {/* Task name */}
        <div className="space-y-2">
          <Label htmlFor="task">Task *</Label>
          <Input
            id="task"
            placeholder="What are you working on?"
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
        </div>

        {/* Intention */}
        <div className="space-y-2">
          <Label htmlFor="intention">Intention (optional)</Label>
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
            <Label>Profile</Label>
            <Select value={profileId} onValueChange={handleProfileChange}>
              <SelectTrigger>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="focus">Focus (min)</Label>
            <Input
              id="focus"
              type="number"
              min={1}
              max={120}
              value={focusDuration}
              onChange={(e) => setFocusDuration(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="break">Break (min)</Label>
            <Input
              id="break"
              type="number"
              min={1}
              max={60}
              value={breakDuration}
              onChange={(e) => setBreakDuration(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longBreak">Long Break (min)</Label>
            <Input
              id="longBreak"
              type="number"
              min={1}
              max={60}
              value={longBreakDuration}
              onChange={(e) => setLongBreakDuration(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sessions">Sessions before long break</Label>
            <Input
              id="sessions"
              type="number"
              min={1}
              max={10}
              value={sessionsBeforeLongBreak}
              onChange={(e) => setSessionsBeforeLongBreak(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Start button */}
        <Button
          className="w-full gap-2 text-lg py-6"
          size="lg"
          onClick={handleStart}
          disabled={!task.trim() || loading}
        >
          <Play className="h-5 w-5" />
          {loading ? "Starting..." : "Start Session"}
        </Button>
      </div>

      {/* Nature quote */}
      <div className="text-center pt-2">
        <p className="text-sm text-muted-foreground italic font-serif">
          "The clearest way into the Universe is through a forest wilderness."
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">-- John Muir</p>
      </div>
    </div>
  );
}
