"use client";

import { useState, useRef } from "react";
import {
  Music2,
  Plus,
  Trash2,
  Play,
  Square,
  CloudRain,
  TreePine,
  Coffee,
  Flame,
  Waves,
  Radio,
  Disc3,
  FileAudio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAudioStore, DEFAULT_SOUNDS, type SoundConfig } from "@/stores/audio.store";
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

const ICON_OPTIONS = [
  { value: "Music2", label: "Music", Icon: Music2 },
  { value: "CloudRain", label: "Rain", Icon: CloudRain },
  { value: "TreePine", label: "Tree", Icon: TreePine },
  { value: "Coffee", label: "Coffee", Icon: Coffee },
  { value: "Flame", label: "Fire", Icon: Flame },
  { value: "Waves", label: "Waves", Icon: Waves },
  { value: "Radio", label: "Radio", Icon: Radio },
  { value: "Disc3", label: "Disc", Icon: Disc3 },
  { value: "FileAudio", label: "Audio", Icon: FileAudio },
];

export default function SoundsPage() {
  const sounds = useAudioStore((s) => s.sounds);
  const addSound = useAudioStore((s) => s.addSound);
  const removeSound = useAudioStore((s) => s.removeSound);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Preview playback
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewHowlRef = useRef<any>(null);

  const handlePreview = (sound: SoundConfig) => {
    // Stop current preview
    if (previewHowlRef.current) {
      previewHowlRef.current.stop();
      previewHowlRef.current.unload();
      previewHowlRef.current = null;
    }

    if (previewId === sound.id) {
      setPreviewId(null);
      return;
    }

    if (typeof window === "undefined") return;
    const { Howl } = require("howler");
    const howl = new Howl({
      src: [sound.src],
      volume: 0.5,
      loop: false,
      onend: () => setPreviewId(null),
    });
    howl.play();
    previewHowlRef.current = howl;
    setPreviewId(sound.id);
  };

  const stopPreview = () => {
    if (previewHowlRef.current) {
      previewHowlRef.current.stop();
      previewHowlRef.current.unload();
      previewHowlRef.current = null;
    }
    setPreviewId(null);
  };

  const handleDelete = (id: string) => {
    stopPreview();
    removeSound(id);
    setDeleteConfirm(null);
  };

  const defaultSoundIds = new Set(DEFAULT_SOUNDS.map((s) => s.id));
  const defaultSounds = sounds.filter((s) => defaultSoundIds.has(s.id));
  const customSounds = sounds.filter((s) => !defaultSoundIds.has(s.id));

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Music2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Sound Library</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage ambient sounds for your focus sessions
            </p>
          </div>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Sound
        </Button>
      </div>

      {/* Default sounds */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Built-in Sounds
        </h2>
        <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {defaultSounds.map((sound) => (
            <SoundRow
              key={sound.id}
              sound={sound}
              isPreview={previewId === sound.id}
              onPreview={() => handlePreview(sound)}
              iconMap={iconMap}
            />
          ))}
        </div>
      </div>

      {/* Custom sounds */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Custom Sounds
        </h2>
        {customSounds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 py-12 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="h-12 w-12 rounded-xl bg-primary/[0.06] flex items-center justify-center mb-3">
              <FileAudio className="h-6 w-6 text-primary/40" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No custom sounds yet</p>
            <p className="text-xs text-muted-foreground/60 max-w-xs">
              Add your own ambient sounds to personalize your focus sessions.
            </p>
          </div>
        ) : (
          <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customSounds.map((sound) => (
              <SoundRow
                key={sound.id}
                sound={sound}
                isPreview={previewId === sound.id}
                onPreview={() => handlePreview(sound)}
                onDelete={() => setDeleteConfirm(sound.id)}
                iconMap={iconMap}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Sound Dialog */}
      <AddSoundDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={addSound}
        existingIds={new Set(sounds.map((s) => s.id))}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Sound</DialogTitle>
            <DialogDescription>
              This sound will be removed from your library. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SoundRow({
  sound,
  isPreview,
  onPreview,
  onDelete,
  iconMap,
}: {
  sound: SoundConfig;
  isPreview: boolean;
  onPreview: () => void;
  onDelete?: () => void;
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
}) {
  const Icon = iconMap[sound.icon] ?? Music2;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200",
        isPreview
          ? "bg-primary/[0.06] border-primary/25 shadow-sm"
          : "bg-card/80 border-border/50 hover:border-border hover:shadow-sm"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          isPreview ? "bg-primary/15" : "bg-muted/60"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 transition-colors",
            isPreview ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{sound.name}</p>
        {!sound.isDefault && (
          <p className="text-[10px] text-muted-foreground/50 truncate">{sound.src}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onPreview}
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
            isPreview
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {isPreview ? (
            <Square className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddSoundDialog({
  open,
  onOpenChange,
  onAdd,
  existingIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (sound: SoundConfig) => void;
  existingIds: Set<string>;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Music2");
  const [filePath, setFilePath] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !filePath.trim()) return;

    const id = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (existingIds.has(id)) return;

    onAdd({
      id,
      name: name.trim(),
      icon,
      src: filePath.trim(),
    });

    setName("");
    setIcon("Music2");
    setFilePath("");
    onOpenChange(false);
  };

  const handleReset = () => {
    setName("");
    setIcon("Music2");
    setFilePath("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleReset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Sound</DialogTitle>
          <DialogDescription>
            Add an ambient sound from your computer. Use an MP3 or audio file that loops well.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="sound-name">Name</Label>
            <Input
              id="sound-name"
              placeholder="e.g. Thunderstorm, Birds, Lo-fi..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map(({ value, label, Icon: OptionIcon }) => (
                <button
                  key={value}
                  type="button"
                  title={label}
                  onClick={() => setIcon(value)}
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                    icon === value
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <OptionIcon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* File path */}
          <div className="space-y-2">
            <Label htmlFor="sound-file">Audio File Path</Label>
            <Input
              id="sound-file"
              placeholder="/path/to/your/sound.mp3"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground/60">
              Enter the full path to an audio file on your computer, or place the file in the sounds folder and use /sounds/filename.mp3
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !filePath.trim()}>
            Add Sound
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
