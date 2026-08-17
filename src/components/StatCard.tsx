export function StatCard({
  label,
  value,
  unit,
  accentColor,
  sublabel,
}: {
  label: string;
  value: string;
  unit?: string;
  accentColor?: string;
  sublabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-whoop-border bg-whoop-panel p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-semibold" style={{ color: accentColor }}>
          {value}
        </span>
        {unit && <span className="text-sm text-white/40">{unit}</span>}
      </p>
      {sublabel && <p className="mt-1 text-xs text-white/40">{sublabel}</p>}
    </div>
  );
}
