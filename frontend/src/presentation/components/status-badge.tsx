export function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-badge--${value.toLowerCase()}`}>{value.replaceAll("_", " ")}</span>;
}
