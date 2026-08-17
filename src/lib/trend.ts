import type { Cycle, Recovery, Sleep } from "./whoop-types";

export interface DayMetric {
  date: string;
  strain?: number;
  recoveryScore?: number;
  sleepPerformance?: number;
  hrv?: number;
  rhr?: number;
}

function sleepDurationMs(sleep: Sleep): number {
  return new Date(sleep.end).getTime() - new Date(sleep.start).getTime();
}

export function buildTrend(cycles: Cycle[], recoveries: Recovery[], sleeps: Sleep[]): DayMetric[] {
  const recoveryByCycle = new Map(recoveries.map((r) => [r.cycle_id, r]));

  const sleepByCycle = new Map<number, Sleep>();
  for (const sleep of sleeps) {
    if (sleep.nap) continue;
    const existing = sleepByCycle.get(sleep.cycle_id);
    if (!existing || sleepDurationMs(sleep) > sleepDurationMs(existing)) {
      sleepByCycle.set(sleep.cycle_id, sleep);
    }
  }

  return cycles
    .filter((c) => c.score_state === "SCORED")
    .map((cycle) => {
      const recovery = recoveryByCycle.get(cycle.id);
      const sleep = sleepByCycle.get(cycle.id);
      return {
        date: cycle.start,
        strain: cycle.score?.strain,
        recoveryScore: recovery?.score?.recovery_score,
        sleepPerformance: sleep?.score?.sleep_performance_percentage,
        hrv: recovery?.score?.hrv_rmssd_milli,
        rhr: recovery?.score?.resting_heart_rate,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
