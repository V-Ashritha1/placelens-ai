"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface AtsTrendPoint {
  resume_id: number;
  file_name: string;
  score: number;
  scanned_at: string;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload as AtsTrendPoint;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-medium">{point.file_name}</p>
      <p className="text-muted-foreground">{formatDate(point.scanned_at)}</p>
      <p className="text-primary font-semibold mt-1">{point.score}% ATS score</p>
    </div>
  );
}

export function AtsTrendChart({ data }: { data: AtsTrendPoint[] }) {
  if (!data || data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <p className="text-sm font-medium">Not enough data yet</p>
        <p className="text-xs text-muted-foreground max-w-[220px]">
          Run at least two ATS scans to see your score trend over time.
        </p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    label: formatDate(point.scanned_at),
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--primary)" }}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}