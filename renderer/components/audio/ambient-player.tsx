"use client";

import { useState } from "react";
import { Music, Play, Square, ChevronDown, ChevronUp, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SoundCard } from "@/components/audio/sound-card";
import { useAudio } from "@/hooks/useAudio";

export function AmbientPlayer() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const {
    sounds,
    isPlaying,
    masterVolume,
    toggleSound,
    setVolume,
    setMasterVolume,
    playAll,
    stopAll,
  } = useAudio();

  const activeSounds = sounds.filter((s) => s.isActive);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Ambient Sounds</CardTitle>
            {activeSounds.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeSounds.length} active
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-7 w-7 p-0"
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Collapsed view: show active sound names */}
        {isCollapsed && activeSounds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {activeSounds.map((sound) => (
              <Badge key={sound.id} variant="outline" className="text-xs">
                {sound.name}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">
          {/* Master volume */}
          <div className="flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground shrink-0 w-20">
              Master
            </span>
            <Slider
              value={[masterVolume * 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={([value]) => setMasterVolume(value / 100)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

          {/* Play All / Stop All buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={playAll}
              disabled={sounds.every((s) => s.isActive)}
              className="flex-1"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Play All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={stopAll}
              disabled={!isPlaying}
              className="flex-1"
            >
              <Square className="h-3.5 w-3.5 mr-1.5" />
              Stop All
            </Button>
          </div>

          {/* Sound cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {sounds.map((sound) => (
              <SoundCard
                key={sound.id}
                sound={sound}
                onToggle={toggleSound}
                onVolumeChange={setVolume}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
