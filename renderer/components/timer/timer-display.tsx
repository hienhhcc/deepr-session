"use client";

import { useTimerStore } from "@/stores/timer.store";
import { formatTime } from "@/lib/utils";

const PHASE_CONFIG = {
  focus: { label: "Focus", color: "stroke-green-500", textColor: "text-green-600" },
  break: { label: "Break", color: "stroke-blue-500", textColor: "text-blue-600" },
  longBreak: { label: "Long Break", color: "stroke-purple-500", textColor: "text-purple-600" },
  idle: { label: "Ready", color: "stroke-muted", textColor: "text-muted-foreground" },
};

const RADIUS = 120;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE_WIDTH) * 2;
const CENTER = SIZE / 2;

export function TimerDisplay() {
  const { phase, remainingSeconds, totalSeconds } = useTimerStore();
  const config = PHASE_CONFIG[phase];

  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            className="stroke-muted"
          />
          {/* Progress ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className={`${config.color} transition-[stroke-dashoffset] duration-1000 ease-linear`}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-semibold font-mono tracking-wider text-foreground">
            {formatTime(remainingSeconds)}
          </span>
          <span className={`text-sm mt-2 font-medium ${config.textColor}`}>
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
