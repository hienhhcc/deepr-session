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
import { useAudioStore, type SoundPreset } from "@/stores/audio.store";
import { AmbientPlayer } from "@/components/audio/ambient-player";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { name: "Forest", value: "#22c55e" },
  { name: "Ocean", value: "#3b82f6" },
  { name: "Sunset", value: "#f97316" },
  { name: "Lavender", value: "#a855f7" },
  { name: "Rose", value: "#ec4899" },
  { name: "Amber", value: "#eab308" },
];

const DURATION_PRESETS = [
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
  { label: "8h", minutes: 480 },
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
  const [focusDuration, setFocusDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState("");
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (open) {
      if (profile) {
        setName(profile.name);
        setColor(profile.color);
        const dur = profile.focusDuration;
        const isPreset = DURATION_PRESETS.some((p) => p.minutes === dur);
        setFocusDuration(dur);
        setIsCustom(!isPreset);
        setCustomDuration(!isPreset ? String(dur) : "");
        // Apply saved sound preset for preview
        if (profile.soundPreset) {
          try {
            const preset = JSON.parse(profile.soundPreset) as SoundPreset;
            useAudioStore.getState().applyPreset(preset);
          } catch {
            // Invalid preset, ignore
          }
        }
      } else {
        setName("");
        setColor(COLOR_PRESETS[0].value);
        setFocusDuration(60);
        setIsCustom(false);
        setCustomDuration("");
      }
    } else {
      // Dialog closed — stop preview sounds
      useAudioStore.getState().stop();
    }
  }, [open, profile]);

  const handlePresetClick = (minutes: number) => {
    setFocusDuration(minutes);
    setIsCustom(false);
    setCustomDuration("");
  };

  const handleCustomFocus = () => {
    setIsCustom(true);
    setCustomDuration(String(focusDuration));
  };

  const handleCustomChange = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setCustomDuration(value);
      if (value !== "") {
        const num = parseInt(value, 10);
        if (num > 0) setFocusDuration(num);
      }
    }
  };

  const handleCustomBlur = () => {
    if (!customDuration || parseInt(customDuration, 10) <= 0) {
      setCustomDuration("");
      setIsCustom(false);
      setFocusDuration(60);
    }
  };

  const isPresetSelected = (minutes: number) => !isCustom && focusDuration === minutes;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const preset = useAudioStore.getState().getPreset();
      const soundPreset = preset ? JSON.stringify(preset) : undefined;

      if (profile) {
        await updateProfile({
          id: profile.id,
          name: name.trim(),
          color,
          focusDuration,
          soundPreset,
        });
      } else {
        await createProfile({
          name: name.trim(),
          color,
          focusDuration,
          soundPreset,
        });
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
          <div className="space-y-3">
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

          {/* Session Duration */}
          <div className="space-y-3">
            <Label>Session Duration</Label>
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
          </div>

          {/* Ambient Sound */}
          <div className="space-y-2">
            <Label>Ambient Sound</Label>
            <AmbientPlayer />
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
