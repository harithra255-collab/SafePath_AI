import { createFileRoute } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Shell } from "@/components/safepath/Shell";
import { useApp } from "@/lib/app-state";
import { RISK_DISTRIBUTION } from "@/data/safepath";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Safety Analytics — SafePath AI" },
      {
        name: "description",
        content:
          "Track total trips, safe trips, average safety score, risk distribution and weekly safety trends.",
      },
      { property: "og:title", content: "Safety Analytics — SafePath AI" },
      {
        property: "og:description",
        content: "Animated dashboards for your personal travel safety performance.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { t, reports, trips } = useApp();
  const safeTrips = trips.filter((trip) => trip.score >= 78).length;
  const moderateTrips = trips.filter((trip) => trip.score >= 60 && trip.score < 78).length;
  const riskyTrips = trips.filter((trip) => trip.score < 60).length;
  const averageScore = trips.length ? (trips.reduce((total, trip) => total + trip.score, 0) / trips.length).toFixed(1) : "0.0";
  const trend = trips.slice(0, 7).reverse().map((trip, index) => ({ day: new Date(trip.startedAt).toLocaleDateString(undefined, { weekday: "short" }), score: trip.score, index }));
  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const monthTrips = trips.filter((trip) => new Date(trip.startedAt).getMonth() === date.getMonth() && new Date(trip.startedAt).getFullYear() === date.getFullYear());
    return { month: date.toLocaleDateString(undefined, { month: "short" }), trips: monthTrips.length, safe: monthTrips.filter((trip) => trip.score >= 78).length };
  });
  const distribution = trips.length ? [{ name: "Safe", value: Math.round((safeTrips / trips.length) * 100) }, { name: "Moderate", value: Math.round((moderateTrips / trips.length) * 100) }, { name: "High Risk", value: Math.round((riskyTrips / trips.length) * 100) }] : RISK_DISTRIBUTION.map((item) => ({ ...item, value: 0 }));
  const stats = [
    { label: t.totalTrips, value: `${trips.length}`, color: "var(--color-primary)" },
    { label: t.safeTrips, value: `${safeTrips}`, color: "var(--color-safe)" },
    { label: t.moderate, value: `${moderateTrips}`, color: "var(--color-warn)" },
    { label: t.highRisk, value: `${riskyTrips}`, color: "var(--color-danger)" },
    { label: t.avgScore, value: averageScore, color: "var(--color-primary)" },
    { label: t.reportsSubmitted, value: `${reports.length}`, color: "var(--color-accent)" },
    { label: "SOS Used", value: `${typeof window === "undefined" ? 0 : Number(localStorage.getItem("sp.sos-count") || 0)}`, color: "var(--color-danger)" },
    { label: "AI Accuracy", value: trips.length ? "Live" : "No data", color: "var(--color-safe)" },
  ];

  const colors = ["var(--color-safe)", "var(--color-warn)", "var(--color-danger)"];

  return (
    <Shell>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-bold">{t.analytics}</h1>
          <p className="text-xs text-muted-foreground">Your travel safety performance</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="animate-rise rounded-2xl border bg-card p-4 shadow-soft"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="font-display text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="mt-0.5 text-[0.66rem] font-semibold text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <section className="rounded-3xl border bg-card p-4 shadow-soft">
          <h2 className="font-display text-sm font-bold">Weekly Safety Trend</h2>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  fill="url(#g1)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-soft">
          <h2 className="font-display text-sm font-bold">Monthly Travel Analytics</h2>
          <div className="mt-3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="trips" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="safe" fill="var(--color-safe)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-soft">
          <h2 className="font-display text-sm font-bold">Risk Distribution</h2>
          <div className="mt-2 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {RISK_DISTRIBUTION.map((_, i) => (
                    <Cell key={i} fill={colors[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4">
            {distribution.map((r, i) => (
              <span key={r.name} className="flex items-center gap-1.5 text-[0.68rem] font-semibold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[i] }} />
                {r.name} {r.value}%
              </span>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
