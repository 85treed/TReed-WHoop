export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
  });
}

export function round(value: number | undefined, digits = 0): number | undefined {
  if (value === undefined) return undefined;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function recoveryColor(score: number | undefined): string {
  if (score === undefined) return "#4b4b55";
  if (score >= 67) return "#16ec06";
  if (score >= 34) return "#ffde00";
  return "#ff0026";
}
