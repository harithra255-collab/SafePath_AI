import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CarFront,
  CloudRain,
  Droplets,
  Flame,
  PartyPopper,
  ShieldAlert,
  TrafficCone,
  Users,
} from "lucide-react";
import { Shell } from "@/components/safepath/Shell";
import { useApp } from "@/lib/app-state";
import { COMMUNITY_ALERTS, type CommunityAlert } from "@/data/safepath";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Community Alerts — SafePath AI" },
      {
        name: "description",
        content:
          "Live timeline of accidents, crime alerts, floods, roadblocks and crowd warnings reported near you.",
      },
      { property: "og:title", content: "Community Alerts — SafePath AI" },
      {
        property: "og:description",
        content: "Real-time community safety timeline with severity indicators and map context.",
      },
    ],
  }),
  component: AlertsPage,
});

const ICON = {
  accident: CarFront,
  crime: ShieldAlert,
  roadblock: TrafficCone,
  flood: Droplets,
  traffic: CarFront,
  rain: CloudRain,
  event: PartyPopper,
  crowd: Users,
  fire: Flame,
  medical: AlertTriangle,
};

const SEV: Record<CommunityAlert["severity"], string> = {
  low: "var(--color-safe)",
  medium: "var(--color-warn)",
  high: "var(--color-danger)",
};

function AlertsPage() {
  const { t, reports } = useApp();

  const merged: CommunityAlert[] = [
    ...reports.map((r) => ({
      id: r.id,
      type: "crime" as const,
      title: r.category,
      detail: r.description || "Reported by you from the SafePath app.",
      place: r.place,
      severity: r.severity,
      minutesAgo: Math.max(1, Math.round((Date.now() - r.createdAt) / 60000)),
    })),
    ...COMMUNITY_ALERTS,
  ].sort((a, b) => a.minutesAgo - b.minutesAgo);

  return (
    <Shell>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-bold">{t.communityAlerts}</h1>
          <p className="text-xs text-muted-foreground">
            {merged.length} reports in the last 4 hours · verified by SafePath AI
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["high", "medium", "low"] as const).map((s) => (
            <div key={s} className="rounded-2xl border bg-card p-3 text-center shadow-soft">
              <p className="font-display text-xl font-bold" style={{ color: SEV[s] }}>
                {merged.filter((m) => m.severity === s).length}
              </p>
              <p className="text-[0.62rem] font-semibold uppercase text-muted-foreground">{s}</p>
            </div>
          ))}
        </div>

        <ol className="relative space-y-3 border-l-2 border-dashed pl-5">
          {merged.map((a, i) => {
            const Icon = ICON[a.type] ?? AlertTriangle;
            return (
              <li
                key={a.id}
                className="animate-rise relative rounded-2xl border bg-card p-4 shadow-soft"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span
                  className="absolute -left-[1.85rem] top-5 grid h-7 w-7 place-items-center rounded-full border-4 border-background"
                  style={{ background: SEV[a.severity] }}
                >
                  <Icon className="h-3.5 w-3.5 text-white" />
                </span>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold">{a.title}</p>
                  <span className="shrink-0 text-[0.62rem] font-semibold text-muted-foreground">
                    {a.minutesAgo < 60 ? `${a.minutesAgo}m ago` : `${Math.round(a.minutesAgo / 60)}h ago`}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.detail}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[0.62rem] font-semibold">
                    📍 {a.place}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[0.62rem] font-bold text-white"
                    style={{ background: SEV[a.severity] }}
                  >
                    {a.severity}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Shell>
  );
}
