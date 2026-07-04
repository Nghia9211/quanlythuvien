import type { ReactNode } from "react";

export function MetricCard({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: string }) {
  return <article className={`metric-card metric-card--${tone}`}><span>{label}</span><strong>{value}</strong></article>;
}
