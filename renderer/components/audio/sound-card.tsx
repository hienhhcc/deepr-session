"use client";

import {
  CloudRain,
  TreePine,
  Coffee,
  Flame,
  Waves,
  Radio,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { SoundConfig } from "@/stores/audio.store";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CloudRain,
  TreePine,
  Coffee,
  Flame,
  Waves,
  Radio,
};

interface SoundCardProps {
  sound: SoundConfig;
  onToggle: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
}

export function SoundCard({ sound, onToggle, onVolumeChange }: SoundCardProps) {
  const Icon = iconMap[sound.icon];

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        sound.isActive
          ? "border-green-500/50 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
          : "border-border"
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                className={cn(
                  "h-4 w-4",
                  sound.isActive ? "text-green-500" : "text-muted-foreground"
                )}
              />
            )}
            <span className="text-sm font-medium">{sound.name}</span>
          </div>
          <Button
            variant={sound.isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(sound.id)}
            className={cn(
              "h-7 px-2 text-xs",
              sound.isActive && "bg-green-600 hover:bg-green-700"
            )}
          >
            {sound.isActive ? "On" : "Off"}
          </Button>
        </div>

        {sound.isActive && (
          <Slider
            value={[sound.volume * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={([value]) =>
              onVolumeChange(sound.id, value / 100)
            }
            className="w-full"
          />
        )}
      </CardContent>
    </Card>
  );
}
