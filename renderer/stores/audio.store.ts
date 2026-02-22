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
  howl: any | null;
  // Actions
  setSounds: (sounds: SoundConfig[]) => void;
  addSound: (sound: SoundConfig) => void;
  removeSound: (id: string) => void;
  play: (id: string) => void;
  stop: () => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  applyPreset: (preset: SoundPreset) => void;
  getPreset: () => SoundPreset | null;
}

export const DEFAULT_SOUNDS: SoundConfig[] = [
  { id: "rain", name: "Rain", icon: "CloudRain", src: "/sounds/rain.mp3", isDefault: true },
  { id: "forest", name: "Forest", icon: "TreePine", src: "/sounds/forest.mp3", isDefault: true },
  { id: "cafe", name: "Cafe", icon: "Coffee", src: "/sounds/cafe.mp3", isDefault: true },
  { id: "fireplace", name: "Fireplace", icon: "Flame", src: "/sounds/fireplace.mp3", isDefault: true },
  { id: "ocean", name: "Ocean", icon: "Waves", src: "/sounds/ocean.mp3", isDefault: true },
  { id: "white-noise", name: "White Noise", icon: "Radio", src: "/sounds/white-noise.mp3", isDefault: true },
];

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
      sounds: DEFAULT_SOUNDS,
      activeSoundId: null,
      volume: 0.7,
      isEnabled: false,
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
        set({ activeSoundId: id, isEnabled: true, howl });
      },

      stop: () => {
        const { howl } = get();
        if (howl) {
          howl.stop();
          howl.unload();
        }
        set({ activeSoundId: null, isEnabled: false, howl: null });
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
              set({ isEnabled: true, howl });
              return;
            }
          }
          set({ isEnabled: true });
        } else {
          if (currentHowl) {
            currentHowl.stop();
            currentHowl.unload();
          }
          set({ isEnabled: false, howl: null });
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
          set({ activeSoundId: null, isEnabled: false, howl: null, volume: preset.volume });
          return;
        }

        const howl = createHowl(sound.src, preset.volume);
        if (howl) howl.play();
        set({ activeSoundId: preset.soundId, isEnabled: true, howl, volume: preset.volume });
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
    }
  )
);
