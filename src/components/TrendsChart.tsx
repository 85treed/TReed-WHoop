"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayMetric } from "@/lib/trend";
import { formatShortDate } from "@/lib/format";

export function TrendsChart({ data }: { data: DayMetric[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
  }));

  return (
    <div className="rounded-2xl border border-whoop-border bg-whoop-panel p-5">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-white/40">
        Recovery &amp; Strain — last {data.length} days
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#24242c" />
          <XAxis dataKey="label" stroke="#6b6b76" fontSize={12} tickLine={false} />
          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            stroke="#6b6b76"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 21]}
            stroke="#6b6b76"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#141419",
              border: "1px solid #24242c",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#f2f2f5" }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="recoveryScore"
            name="Recovery %"
            stroke="#16ec06"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="sleepPerformance"
            name="Sleep %"
            stroke="#7c5cff"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="strain"
            name="Strain"
            stroke="#00c9ff"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 flex gap-4 text-xs text-white/50">
        <Legend color="#16ec06" label="Recovery" />
        <Legend color="#7c5cff" label="Sleep performance" />
        <Legend color="#00c9ff" label="Strain" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
