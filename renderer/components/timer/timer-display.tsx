"use client";

import { useTimerStore } from "@/stores/timer.store";
import { formatTime } from "@/lib/utils";

const PHASE_CONFIG = {
  focus: {
    label: "Focusing",
    strokeColor: "oklch(0.5234 0.1347 144.1672)",
    textClass: "text-primary",
    glowClass: "timer-glow",
    bgAccent: "bg-primary/5",
  },
  break: {
    label: "Break",
    strokeColor: "oklch(0.6234 0.1147 160.0000)",
    textClass: "text-chart-2",
    glowClass: "timer-glow-break",
    bgAccent: "bg-chart-2/5",
  },
  longBreak: {
    label: "Long Break",
    strokeColor: "oklch(0.7234 0.0847 130.0000)",
    textClass: "text-chart-3",
    glowClass: "timer-glow-break",
    bgAccent: "bg-chart-3/5",
  },
  idle: {
    label: "Ready",
    strokeColor: "oklch(0.8700 0.0200 100.0000)",
    textClass: "text-muted-foreground",
    glowClass: "",
    bgAccent: "",
  },
};

const RADIUS = 120;
const STROKE_WIDTH = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE_WIDTH + 4) * 2;
const CENTER = SIZE / 2;

export function TimerDisplay() {
  const { phase, remainingSeconds, totalSeconds } = useTimerStore();
  const config = PHASE_CONFIG[phase];

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const isRunning = phase !== "idle";

  return (
    <div className={`flex flex-col items-center gap-4 ${isRunning ? "animate-fade-in" : ""}`}>
      <div
        className={`relative ${config.glowClass} ${isRunning ? "animate-breathe" : ""}`}
        style={{ width: SIZE, height: SIZE }}
      >
        <svg width={SIZE} height={SIZE} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            stroke="oklch(0.8700 0.0200 100.0000 / 0.4)"
          />
          {/* Progress ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH + 2}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            stroke={config.strokeColor}
            style={{
              transition: "stroke-dashoffset 1s linear",
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-light font-mono tracking-widest text-foreground tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
          <span className={`text-xs mt-2 font-semibold uppercase tracking-[0.2em] ${config.textClass}`}>
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
