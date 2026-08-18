import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getCycleCollection,
  getRecoveryCollection,
  getSleepCollection,
  getWorkoutCollection,
} from "@/lib/whoop";
import { buildTrend } from "@/lib/trend";
import { formatDuration, recoveryColor, round } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { TrendsChart } from "@/components/TrendsChart";
import { WorkoutsList } from "@/components/WorkoutsList";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let recoveries, cycles, sleeps, workouts;
  try {
    [recoveries, cycles, sleeps, workouts] = await Promise.all([
      getRecoveryCollection(user.userId, { limit: 25 }),
      getCycleCollection(user.userId, { limit: 25 }),
      getSleepCollection(user.userId, { limit: 25 }),
      getWorkoutCollection(user.userId, { limit: 10 }),
    ]);
  } catch (err) {
    console.error("Failed to load WHOOP data", err);
    redirect("/login?error=whoop_api_failed");
  }

  const latestRecovery = recoveries.records[0];
  const latestCycle = cycles.records[0];
  const latestSleep = sleeps.records.find((s) => !s.nap) ?? sleeps.records[0];

  const trend = buildTrend(cycles.records, recoveries.records, sleeps.records);

  const recoveryScore = latestRecovery?.score?.recovery_score;
  const strain = latestCycle?.score?.strain;
  const sleepPerformance = latestSleep?.score?.sleep_performance_percentage;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.firstName ? `Hey, ${user.firstName}` : "Your Dashboard"}
          </h1>
          <p className="text-sm text-white/40">Live from your WHOOP account</p>
        </div>
        <LogoutButton />
      </header>

      <section className="mb-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/40">Health</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard
            label="Recovery"
            value={recoveryScore !== undefined ? String(round(recoveryScore)) : "—"}
            unit={recoveryScore !== undefined ? "%" : undefined}
            accentColor={recoveryColor(recoveryScore)}
            sublabel={latestRecovery ? undefined : "No recovery data yet"}
          />
          <StatCard
            label="Strain"
            value={strain !== undefined ? String(round(strain, 1)) : "—"}
            accentColor="#00c9ff"
            sublabel={
              latestCycle?.score_state === "SCORED"
                ? "Today's cycle"
                : latestCycle
                ? "In progress"
                : "No cycle data yet"
            }
          />
          <StatCard
            label="Sleep"
            value={sleepPerformance !== undefined ? String(round(sleepPerformance)) : "—"}
            unit={sleepPerformance !== undefined ? "%" : undefined}
            accentColor="#7c5cff"
            sublabel={
              latestSleep?.score?.stage_summary
                ? `${formatDuration(
                    latestSleep.score.stage_summary.total_in_bed_time_milli -
                      latestSleep.score.stage_summary.total_awake_time_milli
                  )} asleep`
                : latestSleep
                ? "Calculating…"
                : "No sleep data yet"
            }
          />
          <StatCard
            label="HRV"
            value={
              latestRecovery?.score?.hrv_rmssd_milli !== undefined
                ? String(round(latestRecovery.score.hrv_rmssd_milli))
                : "—"
            }
            unit="ms"
          />
          <StatCard
            label="Resting HR"
            value={
              latestRecovery?.score?.resting_heart_rate !== undefined
                ? String(round(latestRecovery.score.resting_heart_rate))
                : "—"
            }
            unit="bpm"
          />
          <StatCard
            label="Respiratory rate"
            value={
              latestSleep?.score?.respiratory_rate !== undefined
                ? round(latestSleep.score.respiratory_rate, 1)!.toFixed(1)
                : "—"
            }
            unit="rpm"
          />
        </div>
      </section>

      {trend.length > 1 && (
        <section className="mb-6">
          <TrendsChart data={trend} />
        </section>
      )}

      <section>
        <WorkoutsList workouts={workouts.records} />
      </section>
    </main>
  );
}
