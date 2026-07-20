export const SCORE_THRESHOLDS = { high: 70, mid: 40 };

export function getScoreVariant(score: number): "success" | "warning" | "destructive" {
  if (score >= SCORE_THRESHOLDS.high) return "success";
  if (score >= SCORE_THRESHOLDS.mid) return "warning";
  return "destructive";
}

export function getScoreColor(score: number): string {
  const variant = getScoreVariant(score);
  return `hsl(var(--${variant}))`;
}