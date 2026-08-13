import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { SafePathLocation } from "@/data/safepath";
import type { OrsRoute } from "@/lib/openroute";

function FitRoute({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => { if (points.length > 1) map.fitBounds(points, { padding: [28, 28] }); }, [map, points]);
  return null;
}

export function OpenStreetMapRoute({ destination, route, className }: { destination: SafePathLocation | null; route: OrsRoute | null; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={`grid place-items-center rounded-3xl border bg-secondary text-sm text-muted-foreground ${className ?? ""}`}>Loading OpenStreetMap…</div>;
  const center: [number, number] = route?.geometry[0] ?? (destination ? [destination.lat, destination.lng] : [13.0827, 80.2757]);
  return <div className={`overflow-hidden rounded-3xl border ${className ?? ""}`}>
    <MapContainer center={center} zoom={13} className="h-full w-full" zoomControl>
      <TileLayer attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {route && <><Polyline positions={route.geometry} pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.9 }} /><CircleMarker center={route.geometry[0]} radius={8} pathOptions={{ color: "white", fillColor: "#2563eb", fillOpacity: 1, weight: 3 }} /><FitRoute points={route.geometry} /></>}
      {destination && <Marker position={[destination.lat, destination.lng]} />}
    </MapContainer>
  </div>;
}
