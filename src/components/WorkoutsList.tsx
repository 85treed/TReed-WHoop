import type { WorkoutV2 } from "@/lib/whoop-types";
import { formatDate, round } from "@/lib/format";

export function WorkoutsList({ workouts }: { workouts: WorkoutV2[] }) {
  if (workouts.length === 0) {
    return (
      <div className="rounded-2xl border border-whoop-border bg-whoop-panel p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-white/40">
          Recent workouts
        </p>
        <p className="mt-3 text-sm text-white/40">No workouts recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-whoop-border bg-whoop-panel p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">
        Recent workouts
      </p>
      <ul className="divide-y divide-whoop-border">
        {workouts.map((workout) => (
          <li key={workout.id} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium capitalize">{workout.sport_name}</p>
              <p className="text-xs text-white/40">{formatDate(workout.start)}</p>
            </div>
            <div className="flex gap-6 text-right">
              <Metric label="Strain" value={round(workout.score?.strain, 1)} color="#00c9ff" />
              <Metric
                label="Avg HR"
                value={workout.score?.average_heart_rate}
                unit="bpm"
                color="#f2f2f5"
              />
              <Metric
                label="Cal"
                value={
                  workout.score?.kilojoule ? round(workout.score.kilojoule / 4.184, 0) : undefined
                }
                color="#f2f2f5"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number | undefined;
  unit?: string;
  color: string;
}) {
  return (
    <div>
      <p className="text-xs text-white/40">{label}</p>
      <p className="text-sm font-medium" style={{ color }}>
        {value ?? "—"}
        {unit && value !== undefined ? ` ${unit}` : ""}
      </p>
    </div>
  );
}
