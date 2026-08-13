import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navigation, Phone } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/safepath/Shell";
import { MapCanvas } from "@/components/safepath/MapCanvas";
import { useApp } from "@/lib/app-state";
import { useTrip } from "@/lib/trip-state";
import { LOCATIONS, type ServiceKind } from "@/data/safepath";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Nearby Emergency Services — SafePath AI" },
      {
        name: "description",
        content:
          "Police stations, hospitals, ambulances, pharmacies, fire stations, shelters, fuel and help centres near you.",
      },
      { property: "og:title", content: "Nearby Emergency Services — SafePath AI" },
      {
        property: "og:description",
        content: "Tap any service to highlight it on the map and simulate navigation.",
      },
    ],
  }),
  component: ServicesPage,
});

const LABEL: Record<ServiceKind, string> = {
  police: "Police Station",
  hospital: "Hospital",
  ambulance: "Ambulance",
  pharmacy: "Pharmacy",
  fire: "Fire Station",
  shelter: "Emergency Shelter",
  fuel: "Petrol Station",
  toilet: "Public Toilet",
  help: "Help Centre",
};

const GLYPH: Record<ServiceKind, string> = {
  police: "🚓",
  hospital: "🏥",
  ambulance: "🚑",
  pharmacy: "💊",
  fire: "🚒",
  shelter: "🏠",
  fuel: "⛽",
  toilet: "🚻",
  help: "ℹ️",
};

function ServicesPage() {
  const { t } = useApp();
  const { dest } = useTrip();
  const loc = dest ?? LOCATIONS[0];
  const [active, setActive] = useState<string | null>(null);

  return (
    <Shell>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-bold">{t.nearbyServices}</h1>
          <p className="text-xs text-muted-foreground">
            Around {loc.name} · avg response {loc.responseMin} min
          </p>
        </div>

        <MapCanvas
          dest={loc}
          routes={[]}
          activeRoute={null}
          layers={{ traffic: false, heatmap: false, weather: false, incidents: false, services: true }}
          highlightServiceId={active}
          className="h-[240px] shadow-soft"
        />

        <div className="space-y-3">
          {loc.services.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setActive(s.id);
                toast.success(`Highlighted ${s.name} on the map`);
              }}
              className={`animate-rise flex w-full items-center gap-3 rounded-3xl border bg-card p-4 text-left shadow-soft transition-all ${
                active === s.id ? "ring-2 ring-primary" : ""
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-lg">
                {GLYPH[s.kind]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{s.name}</span>
                <span className="block text-[0.68rem] text-muted-foreground">
                  {LABEL[s.kind]} · {s.distanceKm} km · {s.etaMin} min
                </span>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-bold ${
                    s.open ? "bg-safe/15 text-safe" : "bg-danger/15 text-danger"
                  }`}
                >
                  {s.open ? "Open now" : "Closed"}
                </span>
              </span>
              <span className="flex flex-col gap-1.5">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toast(`Simulated call to ${s.phone}`);
                  }}
                  className="press grid h-9 w-9 place-items-center rounded-xl bg-secondary"
                >
                  <Phone className="h-4 w-4" />
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success(`Navigating to ${s.name}`);
                  }}
                  className="press grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"
                >
                  <Navigation className="h-4 w-4" />
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Shell>
  );
}
