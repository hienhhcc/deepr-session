"use client";

import { useState, useRef, useEffect } from "react";
import {
  Music2,
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
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAudioStore, type SoundConfig } from "@/stores/audio.store";
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

export default function SoundsPage() {
  const sounds = useAudioStore((s) => s.sounds);
  const removeSound = useAudioStore((s) => s.removeSound);
  const renameSound = useAudioStore((s) => s.renameSound);
  const syncSounds = useAudioStore((s) => s.syncSounds);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Preview playback
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewHowlRef = useRef<any>(null);

  // Sync sounds from filesystem on mount
  useEffect(() => {
    syncSounds();
  }, [syncSounds]);

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
              Sounds are auto-detected from the <code className="text-xs bg-muted/60 px-1.5 py-0.5 rounded">/sounds</code> folder
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncSounds()}
          className="gap-1.5"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          Rescan
        </Button>
      </div>

      {/* Sounds grid */}
      {sounds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/40 py-12 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="h-12 w-12 rounded-xl bg-primary/[0.06] flex items-center justify-center mb-3">
            <FileAudio className="h-6 w-6 text-primary/40" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">No sounds found</p>
          <p className="text-xs text-muted-foreground/60 max-w-xs">
            Place .mp3, .ogg, or .wav files in the <code className="bg-muted/60 px-1 rounded">renderer/public/sounds</code> folder and they'll appear here automatically.
          </p>
        </div>
      ) : (
        <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sounds.map((sound) => (
            <SoundRow
              key={sound.id}
              sound={sound}
              isPreview={previewId === sound.id}
              onPreview={() => handlePreview(sound)}
              onRename={(name) => renameSound(sound.id, name)}
              onDelete={() => setDeleteConfirm(sound.id)}
              iconMap={iconMap}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Sound</DialogTitle>
            <DialogDescription>
              This sound will be removed from your library. The file on disk will not be deleted.
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
  onRename,
  onDelete,
  iconMap,
}: {
  sound: SoundConfig;
  isPreview: boolean;
  onPreview: () => void;
  onRename: (name: string) => void;
  onDelete?: () => void;
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
}) {
  const Icon = iconMap[sound.icon] ?? Music2;
  const [draft, setDraft] = useState(sound.name);

  useEffect(() => { setDraft(sound.name); }, [sound.name]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== sound.name) {
      onRename(trimmed);
    } else {
      setDraft(sound.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setDraft(sound.name);
      (e.target as HTMLElement).blur();
    }
  };

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

      {/* Editable name */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          className="w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0 truncate"
        />
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
