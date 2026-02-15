import { create } from "zustand";

// Conditionally import Howl to handle SSR
const { Howl } = typeof window !== "undefined" ? require("howler") : { Howl: null };

export interface SoundConfig {
  id: string;
  name: string;
  icon: string;
  src: string;
  volume: number;
  isActive: boolean;
  howl?: any;
}

interface AudioState {
  sounds: SoundConfig[];
  isPlaying: boolean;
  masterVolume: number;
  toggleSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  playAll: () => void;
  stopAll: () => void;
}

const defaultSounds: SoundConfig[] = [
  { id: "rain", name: "Rain", icon: "CloudRain", src: "/sounds/rain.mp3", volume: 0.5, isActive: false },
  { id: "forest", name: "Forest", icon: "TreePine", src: "/sounds/forest.mp3", volume: 0.5, isActive: false },
  { id: "cafe", name: "Cafe", icon: "Coffee", src: "/sounds/cafe.mp3", volume: 0.5, isActive: false },
  { id: "fireplace", name: "Fireplace", icon: "Flame", src: "/sounds/fireplace.mp3", volume: 0.5, isActive: false },
  { id: "ocean", name: "Ocean", icon: "Waves", src: "/sounds/ocean.mp3", volume: 0.5, isActive: false },
  { id: "white-noise", name: "White Noise", icon: "Radio", src: "/sounds/white-noise.mp3", volume: 0.5, isActive: false },
];

export const useAudioStore = create<AudioState>((set, get) => ({
  sounds: defaultSounds,
  isPlaying: false,
  masterVolume: 0.8,

  toggleSound: (id: string) => {
    const { sounds, masterVolume } = get();
    const updatedSounds = sounds.map((sound) => {
      if (sound.id !== id) return sound;

      if (sound.isActive) {
        // Stop and unload the Howler instance
        if (sound.howl) {
          sound.howl.stop();
          sound.howl.unload();
        }
        return { ...sound, isActive: false, howl: undefined };
      } else {
        // Create a new Howler instance and play it
        if (!Howl) return { ...sound, isActive: true };
        const howl = new Howl({
          src: [sound.src],
          volume: sound.volume * masterVolume,
          loop: true,
        });
        howl.play();
        return { ...sound, isActive: true, howl };
      }
    });

    const hasActive = updatedSounds.some((s) => s.isActive);
    set({ sounds: updatedSounds, isPlaying: hasActive });
  },

  setVolume: (id: string, volume: number) => {
    const { sounds, masterVolume } = get();
    const updatedSounds = sounds.map((sound) => {
      if (sound.id !== id) return sound;
      if (sound.howl) {
        sound.howl.volume(volume * masterVolume);
      }
      return { ...sound, volume };
    });
    set({ sounds: updatedSounds });
  },

  setMasterVolume: (masterVolume: number) => {
    const { sounds } = get();
    const updatedSounds = sounds.map((sound) => {
      if (sound.howl && sound.isActive) {
        sound.howl.volume(sound.volume * masterVolume);
      }
      return sound;
    });
    set({ masterVolume, sounds: updatedSounds });
  },

  playAll: () => {
    const { sounds, masterVolume } = get();
    const updatedSounds = sounds.map((sound) => {
      if (sound.isActive) return sound;
      if (!Howl) return { ...sound, isActive: true };
      const howl = new Howl({
        src: [sound.src],
        volume: sound.volume * masterVolume,
        loop: true,
      });
      howl.play();
      return { ...sound, isActive: true, howl };
    });
    set({ sounds: updatedSounds, isPlaying: true });
  },

  stopAll: () => {
    const { sounds } = get();
    const updatedSounds = sounds.map((sound) => {
      if (sound.howl) {
        sound.howl.stop();
        sound.howl.unload();
      }
      return { ...sound, isActive: false, howl: undefined };
    });
    set({ sounds: updatedSounds, isPlaying: false });
  },
}));
