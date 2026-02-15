"use client";

import { useState, useEffect } from "react";
import type { Profile } from "@shared/types/profile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { useProfileStore } from "@/stores/profile.store";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { name: "Forest", value: "#22c55e" },
  { name: "Ocean", value: "#3b82f6" },
  { name: "Sunset", value: "#f97316" },
  { name: "Lavender", value: "#a855f7" },
  { name: "Rose", value: "#ec4899" },
  { name: "Amber", value: "#eab308" },
];

interface ProfileFormProps {
  profile?: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileForm({ profile, open, onOpenChange }: ProfileFormProps) {
  const createProfile = useProfileStore((s) => s.createProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0].value);
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [longBreakDuration, setLongBreakDuration] = useState(15);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4);

  useEffect(() => {
    if (open) {
      if (profile) {
        setName(profile.name);
        setColor(profile.color);
        setFocusDuration(profile.focusDuration);
        setBreakDuration(profile.breakDuration);
        setLongBreakDuration(profile.longBreakDuration);
        setSessionsBeforeLongBreak(profile.sessionsBeforeLongBreak);
      } else {
        setName("");
        setColor(COLOR_PRESETS[0].value);
        setFocusDuration(25);
        setBreakDuration(5);
        setLongBreakDuration(15);
        setSessionsBeforeLongBreak(4);
      }
    }
  }, [open, profile]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (profile) {
        await updateProfile({
          id: profile.id,
          name: name.trim(),
          color,
          focusDuration,
          breakDuration,
          longBreakDuration,
          sessionsBeforeLongBreak,
        });
      } else {
        await createProfile({
          name: name.trim(),
          color,
          focusDuration,
          breakDuration,
          longBreakDuration,
          sessionsBeforeLongBreak,
        });
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {profile ? "Edit Profile" : "New Profile"}
          </DialogTitle>
          <DialogDescription>
            {profile
              ? "Update your focus profile settings."
              : "Create a new focus profile to customize your sessions."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="profile-name">Profile Name</Label>
            <Input
              id="profile-name"
              placeholder="e.g. Deep Work, Study, Creative..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.name}
                  className={cn(
                    "h-8 w-8 rounded-full transition-all flex items-center justify-center",
                    "ring-offset-2 ring-offset-background",
                    color === preset.value
                      ? "ring-2 ring-primary scale-110"
                      : "hover:scale-105 opacity-70 hover:opacity-100"
                  )}
                  style={{ backgroundColor: preset.value }}
                  onClick={() => setColor(preset.value)}
                >
                  {color === preset.value && (
                    <Check className="h-4 w-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="focus-duration">Focus (min)</Label>
              <Input
                id="focus-duration"
                type="number"
                min={1}
                max={120}
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break-duration">Break (min)</Label>
              <Input
                id="break-duration"
                type="number"
                min={1}
                max={60}
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="long-break-duration">Long Break (min)</Label>
              <Input
                id="long-break-duration"
                type="number"
                min={1}
                max={60}
                value={longBreakDuration}
                onChange={(e) => setLongBreakDuration(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessions-before-long-break">
                Rounds before long break
              </Label>
              <Input
                id="sessions-before-long-break"
                type="number"
                min={1}
                max={12}
                value={sessionsBeforeLongBreak}
                onChange={(e) =>
                  setSessionsBeforeLongBreak(Number(e.target.value))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {profile ? "Save Changes" : "Create Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
