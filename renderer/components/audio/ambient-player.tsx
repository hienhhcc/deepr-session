"use client";

import { useEffect } from "react";
import {
  CloudRain,
  TreePine,
  Coffee,
  Flame,
  Waves,
  Radio,
  Volume2,
  VolumeX,
  Music2,
  Disc3,
  FileAudio,
  Play,
  Pause,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useAudioStore } from "@/stores/audio.store";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CloudRain,
  TreePine,
  Coffee,
  Flame,
  Waves,
  Radio,
  Disc3,
  FileAudio,
  Music2,
};

export function AmbientPlayer() {
  const sounds = useAudioStore((s) => s.sounds);
  const syncSounds = useAudioStore((s) => s.syncSounds);

  useEffect(() => {
    syncSounds();
  }, [syncSounds]);
  const activeSoundId = useAudioStore((s) => s.activeSoundId);
  const volume = useAudioStore((s) => s.volume);
  const isEnabled = useAudioStore((s) => s.isEnabled);
  const isPaused = useAudioStore((s) => s.isPaused);
  const play = useAudioStore((s) => s.play);
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);
  const stop = useAudioStore((s) => s.stop);
  const setEnabled = useAudioStore((s) => s.setEnabled);
  const setVolume = useAudioStore((s) => s.setVolume);

  const activeSound = sounds.find((s) => s.id === activeSoundId);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (activeSoundId) {
        setEnabled(true);
      } else if (sounds.length > 0) {
        play(sounds[0].id);
      }
    } else {
      setEnabled(false);
    }
  };

  const handleSoundChange = (id: string) => {
    play(id);
  };

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300",
        isEnabled
          ? "bg-primary/[0.04] border-primary/20"
          : "bg-card/60 border-border/60"
      )}
    >
      {/* Header row: label + switch */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Music2
            className={cn(
              "h-4 w-4 transition-colors",
              isEnabled ? "text-primary" : "text-muted-foreground/50"
            )}
          />
          <span
            className={cn(
              "text-[13px] font-medium transition-colors",
              isEnabled ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Ambient Sound
          </span>
          {isEnabled && activeSound && (
            <span className="text-[11px] text-primary/70 font-medium">
              {activeSound.name}
            </span>
          )}
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {/* Controls: play/pause + select + volume — shown when enabled */}
      {isEnabled && (
        <div className="px-4 pb-3.5 pt-0.5 flex items-center gap-3 animate-fade-in">
          <button
            onClick={() => (isPaused ? resume() : pause())}
            className={cn(
              "h-8 w-8 shrink-0 flex items-center justify-center rounded-full transition-colors",
              "bg-primary/10 hover:bg-primary/20 text-primary"
            )}
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5 ml-0.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </button>

          <Select value={activeSoundId ?? ""} onValueChange={handleSoundChange}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-background/80 overflow-hidden">
              <div className="overflow-hidden w-full text-left">
                {activeSound ? (
                  <div className="overflow-hidden whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-block",
                        !isPaused && "animate-marquee"
                      )}
                    >
                      {activeSound.name}
                      {!isPaused && (
                        <span className="inline-block px-6">{activeSound.name}</span>
                      )}
                    </span>
                  </div>
                ) : (
                  <span>Choose sound</span>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              {sounds.map((sound) => {
                const Icon = iconMap[sound.icon];
                return (
                  <SelectItem key={sound.id} value={sound.id}>
                    <span className="flex items-center gap-2">
                      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                      {sound.name}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            {volume === 0 ? (
              <VolumeX className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            ) : (
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            )}
            <Slider
              value={[volume * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([v]) => setVolume(v / 100)}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground/70 w-7 text-right tabular-nums shrink-0">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
