"use client";

import { useEffect, useCallback } from "react";
import { getElectronAPI } from "@/lib/electron-api";
import { useTimerStore, type TimerTick } from "@/stores/timer.store";
import { useSessionStore } from "@/stores/session.store";

export function useTimer() {
  const timerState = useTimerStore();
  const activeSession = useSessionStore((s) => s.activeSession);

  useEffect(() => {
    const api = getElectronAPI();
    if (!api) return;

    const unsubTick = api.timer.onTick((tick: unknown) => {
      timerState.setFromTick(tick as TimerTick);
    });

    const unsubState = api.timer.onStateChanged((state: unknown) => {
      timerState.setFromState(state as TimerTick);
    });

    return () => {
      unsubTick?.();
      unsubState?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(
    async (sessionId?: string) => {
      const api = getElectronAPI();
      const id = sessionId || activeSession?.id;
      if (!api || !id) return;
      const state = await api.timer.start(id);
      if (state) timerState.setFromState(state);
    },
    [activeSession?.id, timerState]
  );

  const pause = useCallback(async () => {
    const api = getElectronAPI();
    if (!api) return;
    await api.timer.pause();
  }, []);

  const resume = useCallback(async () => {
    const api = getElectronAPI();
    if (!api) return;
    await api.timer.resume();
  }, []);

  const stop = useCallback(async () => {
    const api = getElectronAPI();
    if (!api) return;
    await api.timer.stop();
    timerState.reset();
  }, [timerState]);

  const skip = useCallback(async () => {
    const api = getElectronAPI();
    if (!api) return;
    await api.timer.skip();
  }, []);

  return {
    phase: timerState.phase,
    status: timerState.status,
    remainingSeconds: timerState.remainingSeconds,
    totalSeconds: timerState.totalSeconds,
    currentPomodoro: timerState.currentPomodoro,
    accumulatedFocusTime: timerState.accumulatedFocusTime,
    start,
    pause,
    resume,
    stop,
    skip,
  };
}
