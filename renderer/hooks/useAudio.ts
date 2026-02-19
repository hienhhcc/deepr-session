"use client";

import { useEffect } from "react";
import { useAudioStore } from "@/stores/audio.store";

export function useAudio() {
  const sounds = useAudioStore((s) => s.sounds);
  const activeSoundId = useAudioStore((s) => s.activeSoundId);
  const volume = useAudioStore((s) => s.volume);
  const isEnabled = useAudioStore((s) => s.isEnabled);
  const play = useAudioStore((s) => s.play);
  const stop = useAudioStore((s) => s.stop);
  const setEnabled = useAudioStore((s) => s.setEnabled);
  const setVolume = useAudioStore((s) => s.setVolume);

  // Cleanup: stop sound on unmount
  useEffect(() => {
    return () => {
      useAudioStore.getState().stop();
    };
  }, []);

  return {
    sounds,
    activeSoundId,
    volume,
    isEnabled,
    play,
    stop,
    setEnabled,
    setVolume,
  };
}
