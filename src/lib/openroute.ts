import { useEffect, useState } from "react";
import type { SafePathLocation } from "@/data/safepath";
import type { TravelMode } from "@/components/safepath/GoogleMap";

export type OrsRoute = { distance: string; duration: string; geometry: Array<[number, number]> };

const PROFILES: Partial<Record<TravelMode, string>> = { DRIVING: "driving-car", WALKING: "foot-walking", BICYCLING: "cycling-regular" };

export function useOpenRoute(destination: SafePathLocation | null, mode: TravelMode) {
  const [route, setRoute] = useState<OrsRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const key = import.meta.env.VITE_ORS_API_KEY;
    const profile = PROFILES[mode];
    if (!key || !profile || !destination || !navigator.geolocation) {
      setRoute(null); setLoading(false); setUnavailable(mode === "TRANSIT"); return;
    }
    let cancelled = false;
    setLoading(true); setUnavailable(false);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
          method: "POST", headers: { Authorization: key, "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates: [[coords.longitude, coords.latitude], [destination.lng, destination.lat]], instructions: false }),
        });
        if (!response.ok) throw new Error("Route request failed");
        const data = await response.json() as { features?: Array<{ properties?: { summary?: { distance?: number; duration?: number } }; geometry?: { coordinates?: Array<[number, number]> } }> };
        const result = data.features?.[0];
        const summary = result?.properties?.summary;
        const geometry = result?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng] as [number, number]) ?? [];
        if (!summary?.distance || !summary.duration || !geometry.length) throw new Error("No route found");
        if (!cancelled) setRoute({ distance: summary.distance >= 1000 ? `${(summary.distance / 1000).toFixed(1)} km` : `${Math.round(summary.distance)} m`, duration: formatDuration(summary.duration), geometry });
      } catch { if (!cancelled) { setRoute(null); setUnavailable(true); } }
      finally { if (!cancelled) setLoading(false); }
    }, () => { if (!cancelled) { setRoute(null); setLoading(false); setUnavailable(true); } }, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 });
    return () => { cancelled = true; };
  }, [destination, mode]);
  return { route, loading, unavailable };
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`;
}
