"use client";

import { useEffect } from "react";
import { useAudioStore } from "@/stores/audio.store";

export function useAudio() {
  const sounds = useAudioStore((s) => s.sounds);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const masterVolume = useAudioStore((s) => s.masterVolume);
  const toggleSound = useAudioStore((s) => s.toggleSound);
  const setVolume = useAudioStore((s) => s.setVolume);
  const setMasterVolume = useAudioStore((s) => s.setMasterVolume);
  const playAll = useAudioStore((s) => s.playAll);
  const stopAll = useAudioStore((s) => s.stopAll);

  // Cleanup: stop all sounds on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sounds,
    isPlaying,
    masterVolume,
    toggleSound,
    setVolume,
    setMasterVolume,
    playAll,
    stopAll,
  };
}
