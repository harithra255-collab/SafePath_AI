import { useEffect, useMemo, useRef, useState } from "react";
import type { NearbyService, RouteOption, SafePathLocation } from "@/data/safepath";

const KIND_GLYPH: Record<string, string> = {
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

export type MapLayers = {
  traffic: boolean;
  heatmap: boolean;
  weather: boolean;
  incidents: boolean;
  services: boolean;
};

export function MapCanvas({
  dest,
  routes,
  activeRoute,
  layers,
  highlightServiceId,
  progress,
  className,
}: {
  dest: SafePathLocation | null;
  routes: RouteOption[];
  activeRoute: RouteOption | null;
  layers: MapLayers;
  highlightServiceId?: string | null;
  progress?: number;
  className?: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [pulse, setPulse] = useState(0);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [vehicle, setVehicle] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 1), 1600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress == null || !pathRef.current) {
      setVehicle(null);
      return;
    }
    const len = pathRef.current.getTotalLength();
    const pt = pathRef.current.getPointAtLength(len * Math.min(1, Math.max(0, progress)));
    setVehicle({ x: pt.x, y: pt.y });
  }, [progress, activeRoute]);

  const services: NearbyService[] = useMemo(
    () => (dest && layers.services ? dest.services : []),
    [dest, layers.services],
  );

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-[var(--map-land)] ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 340 340"
        className="h-full w-full transition-transform duration-500 ease-out"
        style={{ transform: `scale(${zoom}) rotate(${rot}deg)` }}
      >
        <defs>
          <radialGradient id="risk" cx="50%" cy="50%">
            <stop offset="0%" stopColor="var(--color-danger)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--color-danger)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="warmzone" cx="50%" cy="50%">
            <stop offset="0%" stopColor="var(--color-warn)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--color-warn)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rain" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* water */}
        <path
          d="M 0 250 C 60 235, 120 285, 190 268 S 300 300, 340 280 L 340 340 L 0 340 Z"
          fill="var(--map-water)"
        />
        <circle cx="278" cy="52" r="34" fill="var(--map-water)" opacity="0.8" />

        {/* blocks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const x = 14 + (i % 6) * 55 + ((i * 7) % 9);
          const y = 14 + Math.floor(i / 6) * 62 + ((i * 5) % 11);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={38 + ((i * 3) % 12)}
              height={34 + ((i * 5) % 14)}
              rx="6"
              fill="var(--color-muted)"
              opacity="0.55"
            />
          );
        })}

        {/* roads */}
        {[62, 128, 196, 264].map((y) => (
          <line
            key={`h${y}`}
            x1="0"
            y1={y}
            x2="340"
            y2={y}
            stroke="var(--map-road)"
            strokeWidth="8"
            strokeLinecap="round"
          />
        ))}
        {[58, 132, 208, 284].map((x) => (
          <line
            key={`v${x}`}
            x1={x}
            y1="0"
            x2={x}
            y2="340"
            stroke="var(--map-road)"
            strokeWidth="7"
            strokeLinecap="round"
          />
        ))}

        {layers.traffic && (
          <>
            <line x1="0" y1="128" x2="340" y2="128" stroke="var(--color-danger)" strokeWidth="4" opacity="0.75" />
            <line x1="132" y1="0" x2="132" y2="340" stroke="var(--color-warn)" strokeWidth="4" opacity="0.7" />
            <line x1="0" y1="264" x2="340" y2="264" stroke="var(--color-safe)" strokeWidth="4" opacity="0.6" />
          </>
        )}

        {layers.weather && (
          <rect x="0" y="0" width="340" height="340" fill="url(#rain)" />
        )}

        {layers.heatmap && (
          <>
            <circle cx="118" cy="205" r="62" fill="url(#risk)" />
            <circle cx="245" cy="145" r="54" fill="url(#warmzone)" />
            <circle cx="70" cy="90" r="44" fill="url(#warmzone)" />
          </>
        )}

        {/* routes */}
        {routes.map((r) => {
          const active = activeRoute?.id === r.id;
          return (
            <path
              key={r.id}
              ref={active ? pathRef : undefined}
              d={r.path}
              fill="none"
              stroke={r.color}
              strokeWidth={active ? 7 : 4}
              strokeLinecap="round"
              opacity={active ? 1 : 0.35}
              strokeDasharray="600"
              strokeDashoffset="0"
              style={{
                animation: "sp-dash 1.4s ease-out both",
                filter: active ? `drop-shadow(0 0 6px ${r.color})` : undefined,
              }}
            />
          );
        })}

        {/* origin */}
        <g>
          <circle cx="40" cy="300" r="16" fill="var(--color-primary)" opacity="0.18">
            <animate attributeName="r" values="12;24;12" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="40" cy="300" r="8" fill="var(--color-primary)" stroke="white" strokeWidth="3" />
        </g>

        {/* incidents */}
        {layers.incidents &&
          [
            { x: 150, y: 210 },
            { x: 232, y: 118 },
            { x: 96, y: 132 },
          ].map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="9" fill="var(--color-danger)" opacity="0.9" />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="10" fill="white">
                !
              </text>
            </g>
          ))}

        {/* services */}
        {services.map((s) => {
          const on = highlightServiceId === s.id;
          const x = (s.x / 100) * 300 + 20;
          const y = (s.y / 100) * 300 + 20;
          return (
            <g key={s.id} style={{ transition: "all .3s" }}>
              {on && (
                <circle cx={x} cy={y} r="18" fill="var(--color-primary)" opacity="0.25">
                  <animate attributeName="r" values="12;26;12" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={x}
                cy={y}
                r={on ? 13 : 10}
                fill="var(--color-card)"
                stroke={on ? "var(--color-primary)" : "var(--color-border)"}
                strokeWidth={on ? 3 : 1.5}
              />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={on ? 13 : 10}>
                {KIND_GLYPH[s.kind]}
              </text>
            </g>
          );
        })}

        {/* destination */}
        {dest && (
          <g key={`${dest.id}-${pulse}`}>
            <circle cx="300" cy="96" r="14" fill="var(--color-safe)" opacity="0.2">
              <animate attributeName="r" values="10;26;10" dur="2s" repeatCount="indefinite" />
            </circle>
            <path
              d="M 300 78 C 290 78, 283 86, 283 95 C 283 107, 300 120, 300 120 C 300 120, 317 107, 317 95 C 317 86, 310 78, 300 78 Z"
              fill="var(--color-danger)"
              stroke="white"
              strokeWidth="2.5"
            />
            <circle cx="300" cy="95" r="5" fill="white" />
          </g>
        )}

        {/* vehicle */}
        {vehicle && (
          <g>
            <circle cx={vehicle.x} cy={vehicle.y} r="14" fill="var(--color-primary)" opacity="0.25" />
            <circle
              cx={vehicle.x}
              cy={vehicle.y}
              r="9"
              fill="var(--color-primary)"
              stroke="white"
              strokeWidth="3"
            />
          </g>
        )}
      </svg>

      {/* controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <MapBtn onClick={() => setZoom((z) => Math.min(2.2, z + 0.2))}>+</MapBtn>
        <MapBtn onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}>−</MapBtn>
        <MapBtn onClick={() => setRot((r) => (r + 30) % 360)}>⟳</MapBtn>
        <MapBtn
          onClick={() => {
            setZoom(1);
            setRot(0);
          }}
        >
          ⌖
        </MapBtn>
      </div>
    </div>
  );
}

function MapBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="press glass grid h-9 w-9 place-items-center rounded-xl text-sm font-semibold shadow-soft"
    >
      {children}
    </button>
  );
}
