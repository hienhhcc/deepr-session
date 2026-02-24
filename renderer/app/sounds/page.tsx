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
  Loader2,
  ListMusic,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  ArrowUp,
  ArrowDown,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useAudioStore, type SoundConfig, type Playlist } from "@/stores/audio.store";
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
  const playlists = useAudioStore((s) => s.playlists);
  const fetchPlaylists = useAudioStore((s) => s.fetchPlaylists);
  const createPlaylist = useAudioStore((s) => s.createPlaylist);
  const updatePlaylist = useAudioStore((s) => s.updatePlaylist);
  const removePlaylist = useAudioStore((s) => s.removePlaylist);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletePlaylistConfirm, setDeletePlaylistConfirm] = useState<string | null>(null);
  const [rescanning, setRescanning] = useState(false);

  // Preview playback
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewHowlRef = useRef<any>(null);

  // Sync sounds and playlists from filesystem on mount
  useEffect(() => {
    syncSounds();
    fetchPlaylists();
  }, [syncSounds, fetchPlaylists]);

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
          disabled={rescanning}
          onClick={async () => {
            setRescanning(true);
            await syncSounds();
            await fetchPlaylists();
            setRescanning(false);
          }}
          className="gap-1.5"
        >
          {rescanning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FolderOpen className="h-3.5 w-3.5" />
          )}
          {rescanning ? "Scanning..." : "Rescan"}
        </Button>
      </div>

      {/* Playlists section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListMusic className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Playlists</h2>
            <span className="text-xs text-muted-foreground">({playlists.length})</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => createPlaylist("New Playlist", [])}
            className="gap-1.5 h-7 text-xs"
          >
            <Plus className="h-3 w-3" />
            New Playlist
          </Button>
        </div>
        {playlists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 py-6 flex flex-col items-center justify-center text-center">
            <ListMusic className="h-5 w-5 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground/60">
              Create a playlist to group sounds together
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {playlists.map((playlist) => (
              <PlaylistRow
                key={playlist.id}
                playlist={playlist}
                sounds={sounds}
                onRename={(name) => updatePlaylist(playlist.id, { name })}
                onUpdateSounds={(soundIds) => updatePlaylist(playlist.id, { soundIds })}
                onDelete={() => setDeletePlaylistConfirm(playlist.id)}
              />
            ))}
          </div>
        )}
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

      {/* Delete Sound Confirmation */}
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

      {/* Delete Playlist Confirmation */}
      <Dialog open={!!deletePlaylistConfirm} onOpenChange={() => setDeletePlaylistConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Playlist</DialogTitle>
            <DialogDescription>
              This playlist will be permanently deleted. Your sounds will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePlaylistConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletePlaylistConfirm) {
                  removePlaylist(deletePlaylistConfirm);
                  setDeletePlaylistConfirm(null);
                }
              }}
            >
              Delete
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

function PlaylistRow({
  playlist,
  sounds,
  onRename,
  onUpdateSounds,
  onDelete,
}: {
  playlist: Playlist;
  sounds: SoundConfig[];
  onRename: (name: string) => void;
  onUpdateSounds: (soundIds: string[]) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(playlist.name);

  useEffect(() => { setDraft(playlist.name); }, [playlist.name]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== playlist.name) {
      onRename(trimmed);
    } else {
      setDraft(playlist.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      setDraft(playlist.name);
      (e.target as HTMLElement).blur();
    }
  };

  const handleToggleSound = (soundId: string) => {
    if (playlist.soundIds.includes(soundId)) {
      onUpdateSounds(playlist.soundIds.filter((id) => id !== soundId));
    } else {
      onUpdateSounds([...playlist.soundIds, soundId]);
    }
  };

  const handleRemoveSound = (soundId: string) => {
    onUpdateSounds(playlist.soundIds.filter((id) => id !== soundId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ids = [...playlist.soundIds];
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    onUpdateSounds(ids);
  };

  const handleMoveDown = (index: number) => {
    if (index === playlist.soundIds.length - 1) return;
    const ids = [...playlist.soundIds];
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    onUpdateSounds(ids);
  };

  return (
    <div className="rounded-xl border bg-card/80 border-border/50 transition-all duration-200 hover:border-border">
      {/* Playlist header */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ListMusic className="h-4 w-4 text-primary" />
        </div>
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
        <span className="text-xs text-muted-foreground shrink-0">
          {playlist.soundIds.length} {playlist.soundIds.length === 1 ? "sound" : "sounds"}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onDelete}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Expanded: sound list + add */}
      {expanded && (
        <div className="px-4 pb-3 pt-0 border-t border-border/40">
          {playlist.soundIds.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-3 text-center">
              No sounds yet — add some below
            </p>
          ) : (
            <ul className="py-2 space-y-1">
              {playlist.soundIds.map((soundId, index) => {
                const sound = sounds.find((s) => s.id === soundId);
                if (!sound) return null;
                return (
                  <li key={soundId} className="flex items-center gap-2 text-sm py-1 group/item">
                    <span className="text-xs text-muted-foreground/50 w-4 text-right tabular-nums">
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate">{sound.name}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === playlist.soundIds.length - 1}
                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveSound(soundId)}
                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {sounds.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full h-7 mt-1 px-2 text-xs text-left rounded-md border border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/50 transition-colors flex items-center justify-between">
                  <span>Add sounds...</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                {sounds.map((sound) => (
                  <DropdownMenuCheckboxItem
                    key={sound.id}
                    checked={playlist.soundIds.includes(sound.id)}
                    onCheckedChange={() => handleToggleSound(sound.id)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {sound.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}
