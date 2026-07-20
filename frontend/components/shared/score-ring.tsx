import * as React from "react";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

import { getScoreColor } from "@/lib/score-color";

export function ScoreRing({ score, size = 96, strokeWidth = 8, label, className }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className={cn("relative inline-flex flex-col items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="score-ring -rotate-90"
        style={
          {
            "--ring-circumference": `${circumference}px`,
            "--ring-offset": `${offset}px`,
          } as React.CSSProperties
        }
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-ring-fill"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-semibold tabular-nums">{score}</span>
        {label ? <span className="text-[10px] text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  );
}
