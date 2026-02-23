import { create } from "zustand";
import { persist } from "zustand/middleware";

// Conditionally import Howl to handle SSR
const { Howl } =
  typeof window !== "undefined" ? require("howler") : { Howl: null };

export interface SoundConfig {
  id: string;
  name: string;
  icon: string;
  src: string;
  isDefault?: boolean;
}

export interface SoundPreset {
  soundId: string;
  volume: number;
}

interface AudioState {
  // Persisted
  sounds: SoundConfig[];
  // Runtime (not persisted)
  activeSoundId: string | null;
  volume: number;
  isEnabled: boolean;
  isPaused: boolean;
  howl: any | null;
  // Actions
  setSounds: (sounds: SoundConfig[]) => void;
  addSound: (sound: SoundConfig) => void;
  removeSound: (id: string) => void;
  renameSound: (id: string, name: string) => void;
  syncSounds: () => Promise<void>;
  play: (id: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  applyPreset: (preset: SoundPreset) => void;
  getPreset: () => SoundPreset | null;
}

/** Convert a filename like "work-music-for-coding-flow.mp3" to "Work Music For Coding Flow" */
function filenameToName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "") // strip extension
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function createHowl(src: string, volume: number): any {
  if (!Howl) return null;
  return new Howl({
    src: [src],
    volume,
    loop: true,
    html5: true, // Stream audio — starts playing immediately instead of downloading entire file first
  });
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set, get) => ({
      sounds: [],
      activeSoundId: null,
      volume: 0.2,
      isEnabled: false,
      isPaused: false,
      howl: null,

      setSounds: (sounds: SoundConfig[]) => set({ sounds }),

      addSound: (sound: SoundConfig) =>
        set((state) => ({ sounds: [...state.sounds, sound] })),

      removeSound: (id: string) => {
        const { activeSoundId } = get();
        if (activeSoundId === id) {
          get().stop();
        }
        set((state) => ({
          sounds: state.sounds.filter((s) => s.id !== id),
        }));
      },

      renameSound: (id: string, name: string) => {
        set((state) => ({
          sounds: state.sounds.map((s) => (s.id === id ? { ...s, name } : s)),
        }));
      },

      syncSounds: async () => {
        if (typeof window === "undefined") return;
        const api = (window as any).electronAPI;
        if (!api?.audio?.scanSounds) return;

        try {
          const files: { filename: string; src: string }[] =
            await api.audio.scanSounds();
          const { sounds: current } = get();

          // Index existing sounds by src for fast lookup
          const existingBySrc = new Map(current.map((s) => [s.src, s]));
          const fileSrcs = new Set(files.map((f) => f.src));

          const merged: SoundConfig[] = [];

          // Add all sounds found on disk, preserving user customizations
          for (const file of files) {
            const existing = existingBySrc.get(file.src);
            if (existing) {
              merged.push(existing);
            } else {
              const id = file.filename
                .replace(/\.[^.]+$/, "")
                .replace(/\s+/g, "-")
                .toLowerCase();
              merged.push({
                id,
                name: filenameToName(file.filename),
                icon: "Music2",
                src: file.src,
                isDefault: true,
              });
            }
          }

          // Keep non-default sounds that aren't from the /sounds folder (custom paths)
          for (const sound of current) {
            if (!fileSrcs.has(sound.src) && !sound.isDefault) {
              merged.push(sound);
            }
          }

          set({ sounds: merged });
        } catch (err) {
          console.error("[audio] Failed to sync sounds:", err);
        }
      },

      play: (id: string) => {
        const { sounds, volume, howl: currentHowl } = get();
        const sound = sounds.find((s) => s.id === id);
        if (!sound) return;

        // Stop current sound
        if (currentHowl) {
          currentHowl.stop();
          currentHowl.unload();
        }

        const howl = createHowl(sound.src, volume);
        if (howl) howl.play();
        set({ activeSoundId: id, isEnabled: true, isPaused: false, howl });
      },

      pause: () => {
        const { howl } = get();
        if (howl) howl.pause();
        set({ isPaused: true });
      },

      resume: () => {
        const { howl } = get();
        if (howl) howl.play();
        set({ isPaused: false });
      },

      stop: () => {
        const { howl } = get();
        if (howl) {
          howl.stop();
          howl.unload();
        }
        set({
          activeSoundId: null,
          isEnabled: false,
          isPaused: false,
          howl: null,
        });
      },

      setEnabled: (enabled: boolean) => {
        const { activeSoundId, sounds, volume, howl: currentHowl } = get();
        if (enabled) {
          // If there's a previously selected sound, resume it
          if (activeSoundId) {
            const sound = sounds.find((s) => s.id === activeSoundId);
            if (sound) {
              if (currentHowl) {
                currentHowl.stop();
                currentHowl.unload();
              }
              const howl = createHowl(sound.src, volume);
              if (howl) howl.play();
              set({ isEnabled: true, isPaused: false, howl });
              return;
            }
          }
          set({ isEnabled: true });
        } else {
          if (currentHowl) {
            currentHowl.stop();
            currentHowl.unload();
          }
          set({ isEnabled: false, isPaused: false, howl: null });
        }
      },

      setVolume: (volume: number) => {
        const { howl } = get();
        if (howl) {
          howl.volume(volume);
        }
        set({ volume });
      },

      applyPreset: (preset: SoundPreset) => {
        const state = get();
        // Stop current
        if (state.howl) {
          state.howl.stop();
          state.howl.unload();
        }

        const sound = state.sounds.find((s) => s.id === preset.soundId);
        if (!sound) {
          set({
            activeSoundId: null,
            isEnabled: false,
            howl: null,
            volume: preset.volume,
          });
          return;
        }

        const howl = createHowl(sound.src, preset.volume);
        if (howl) howl.play();
        set({
          activeSoundId: preset.soundId,
          isEnabled: true,
          isPaused: false,
          howl,
          volume: preset.volume,
        });
      },

      getPreset: (): SoundPreset | null => {
        const { activeSoundId, volume, isEnabled } = get();
        if (!isEnabled || !activeSoundId) return null;
        return { soundId: activeSoundId, volume };
      },
    }),
    {
      name: "deepr-audio",
      partialize: (state) => ({
        sounds: state.sounds,
        volume: state.volume,
        activeSoundId: state.activeSoundId,
      }),
    },
  ),
);
