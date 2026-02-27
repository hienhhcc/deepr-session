"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  SkipBack,
  SkipForward,
  ListMusic,
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

const MARQUEE_STYLE_ID = "marquee-keyframes";
const MARQUEE_CSS = `
@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}`;

export function AmbientPlayer() {
  const sounds = useAudioStore((s) => s.sounds);
  const syncSounds = useAudioStore((s) => s.syncSounds);
  const playlists = useAudioStore((s) => s.playlists);
  const fetchPlaylists = useAudioStore((s) => s.fetchPlaylists);
  const activePlaylistId = useAudioStore((s) => s.activePlaylistId);
  const playPlaylist = useAudioStore((s) => s.playPlaylist);
  const playNext = useAudioStore((s) => s.playNext);
  const playPrev = useAudioStore((s) => s.playPrev);

  useEffect(() => {
    syncSounds();
    fetchPlaylists();
  }, [syncSounds, fetchPlaylists]);

  // Once playlists are loaded, if activePlaylistId is set but nothing is playing
  // (e.g. restored from a profile preset before playlists were fetched), start it.
  useEffect(() => {
    if (activePlaylistId && playlists.length > 0) {
      const { howl } = useAudioStore.getState();
      if (!howl) {
        playPlaylist(activePlaylistId);
      }
    }
  }, [playlists, activePlaylistId, playPlaylist]);

  // Inject marquee keyframes into <head> once
  useEffect(() => {
    if (document.getElementById(MARQUEE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = MARQUEE_STYLE_ID;
    style.textContent = MARQUEE_CSS;
    document.head.appendChild(style);
  }, []);
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
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);

  // Marquee: only scroll if the text overflows the container
  const marqueeContainerRef = useRef<HTMLDivElement>(null);
  const marqueeTextRef = useRef<HTMLSpanElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);

  const checkOverflow = useCallback(() => {
    const container = marqueeContainerRef.current;
    const text = marqueeTextRef.current;
    if (container && text) {
      setNeedsMarquee(text.scrollWidth > container.clientWidth);
    }
  }, []);

  useEffect(() => {
    checkOverflow();
  }, [activeSound?.name, isEnabled, checkOverflow]);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      if (activePlaylistId) {
        playPlaylist(activePlaylistId);
      } else if (activeSoundId) {
        setEnabled(true);
      } else if (sounds.length > 0) {
        play(sounds[0].id);
      }
    } else {
      setEnabled(false);
    }
  };

  const handleSoundChange = (value: string) => {
    if (value.startsWith("playlist:")) {
      const playlistId = value.replace("playlist:", "");
      playPlaylist(playlistId);
    } else {
      play(value);
    }
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
            <span className="text-[11px] text-primary/70 font-medium truncate max-w-[120px]">
              {activeSound.name}
            </span>
          )}
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {/* Controls: prev + play/pause + next + select + volume — shown when enabled */}
      {isEnabled && (
        <div className="px-4 pb-3.5 pt-0.5 flex items-center gap-2 animate-fade-in">
          {activePlaylist && (
            <button
              onClick={playPrev}
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full transition-colors bg-primary/10 hover:bg-primary/20 text-primary"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
          )}

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

          {activePlaylist && (
            <button
              onClick={playNext}
              className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full transition-colors bg-primary/10 hover:bg-primary/20 text-primary"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
          )}

          <Select
            value={activePlaylistId ? `playlist:${activePlaylistId}` : (activeSoundId ?? "")}
            onValueChange={handleSoundChange}
          >
            <SelectTrigger className="h-8 w-[160px] text-xs bg-background/80 [&>span]:!line-clamp-none [&>span]:!overflow-hidden">
              <div
                ref={marqueeContainerRef}
                className="overflow-hidden w-full text-left relative"
              >
                {/* Hidden span for measuring text width — always present */}
                <span
                  ref={marqueeTextRef}
                  className="invisible absolute top-0 left-0 whitespace-nowrap"
                  aria-hidden
                >
                  {activePlaylist ? activePlaylist.name : (activeSound?.name ?? "Choose sound")}
                </span>

                {activePlaylist ? (
                  needsMarquee && !isPaused ? (
                    <div
                      className="inline-flex whitespace-nowrap"
                      style={{ width: "max-content", animation: "marquee-scroll 8s linear infinite" }}
                    >
                      <span>{activePlaylist.name}</span>
                      <span className="ml-10">{activePlaylist.name}</span>
                    </div>
                  ) : (
                    <span className="block truncate">{activePlaylist.name}</span>
                  )
                ) : activeSound ? (
                  needsMarquee && !isPaused ? (
                    <div
                      className="inline-flex whitespace-nowrap"
                      style={{ width: "max-content", animation: "marquee-scroll 8s linear infinite" }}
                    >
                      <span>{activeSound.name}</span>
                      <span className="ml-10">{activeSound.name}</span>
                    </div>
                  ) : (
                    <span className="block truncate">
                      {activeSound.name}
                    </span>
                  )
                ) : (
                  <span>Choose sound</span>
                )}
              </div>
            </SelectTrigger>
            <SelectContent>
              {playlists.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    Playlists
                  </div>
                  {playlists.map((pl) => (
                    <SelectItem key={`playlist:${pl.id}`} value={`playlist:${pl.id}`}>
                      <span className="flex items-center gap-2">
                        <ListMusic className="h-3.5 w-3.5 text-muted-foreground" />
                        {pl.name}
                        <span className="text-[10px] text-muted-foreground/50">{pl.soundIds.length}</span>
                      </span>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                    Sounds
                  </div>
                </>
              )}
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
