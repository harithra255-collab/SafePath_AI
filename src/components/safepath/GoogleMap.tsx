import { GoogleMap, DirectionsRenderer, TrafficLayer, useJsApiLoader } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";
import type { SafePathLocation } from "@/data/safepath";

export type TravelMode = "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
export type LiveRouteInfo = {
  distance: string;
  duration: string;
  durationInTraffic?: string;
  summary: string;
};

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 13.0827, lng: 80.2757 };

export function GoogleRouteMap({
  destination,
  mode,
  showTraffic,
  selectedRouteIndex = 0,
  onRoutesChange,
  onLocationStatus,
  className,
}: {
  destination: SafePathLocation | null;
  mode: TravelMode;
  showTraffic: boolean;
  selectedRouteIndex?: number;
  onRoutesChange?: (routes: LiveRouteInfo[]) => void;
  onLocationStatus?: (usingCurrentLocation: boolean) => void;
  className?: string;
}) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    id: "safepath-google-map",
    googleMapsApiKey: apiKey || "",
  });
  const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const center = useMemo(() => destination ? { lat: destination.lat, lng: destination.lng } : origin ?? defaultCenter, [destination, origin]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOrigin({ lat: coords.latitude, lng: coords.longitude });
        onLocationStatus?.(true);
      },
      () => {
        setOrigin(defaultCenter);
        onLocationStatus?.(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  }, []);

  useEffect(() => {
    if (!isLoaded || !destination || !origin) {
      setDirections(null);
      return;
    }
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode[mode],
        provideRouteAlternatives: true,
        drivingOptions: mode === "DRIVING" ? { departureTime: new Date(), trafficModel: google.maps.TrafficModel.BEST_GUESS } : undefined,
      },
      (result, status) => {
        if (status !== "OK" || !result) {
          setDirections(null);
          onRoutesChange?.([]);
          return;
        }
        setDirections(result);
        onRoutesChange?.(result.routes.map((route) => {
          const leg = route.legs[0];
          return {
            distance: leg?.distance?.text ?? "—",
            duration: leg?.duration?.text ?? "—",
            durationInTraffic: leg?.duration_in_traffic?.text,
            summary: route.summary || "Google route",
          };
        }));
      },
    );
  }, [destination, isLoaded, mode, onRoutesChange, origin]);

  if (!apiKey) {
    return <MapMessage className={className} message="Add VITE_GOOGLE_MAPS_API_KEY to display the live Google map." />;
  }
  if (loadError) {
    return <MapMessage className={className} message="Google Maps could not load. Check that the Maps JavaScript and Directions APIs are enabled for this key." />;
  }
  if (!isLoaded) return <MapMessage className={className} message="Loading live map…" />;

  return (
    <div className={`overflow-hidden rounded-3xl border ${className ?? ""}`}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={destination ? 13 : 12} options={{ fullscreenControl: false, mapTypeControl: false, streetViewControl: false }}>
        {showTraffic && <TrafficLayer />}
        {directions ? <DirectionsRenderer directions={directions} options={{ routeIndex: Math.min(selectedRouteIndex, directions.routes.length - 1), suppressMarkers: false, polylineOptions: { strokeColor: "#2563eb", strokeWeight: 6 } }} /> : null}
      </GoogleMap>
    </div>
  );
}

function MapMessage({ className, message }: { className?: string; message: string }) {
  return <div className={`grid place-items-center rounded-3xl border bg-secondary p-6 text-center text-sm text-muted-foreground ${className ?? ""}`}>{message}</div>;
}
