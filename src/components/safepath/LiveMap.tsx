import {
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
};

// Default location shown before the browser gets GPS location
const defaultCenter = {
  lat: 11.3410,
  lng: 77.7172,
};

export function LiveMap() {
  const [location, setLocation] = useState(defaultCenter);
  const [locationError, setLocationError] = useState("");

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  // Get and continuously update the user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location services.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setLocationError("");
      },
      (error) => {
        console.error("Location error:", error);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Location permission was denied. Please allow location access."
          );
        } else {
          setLocationError("Unable to get your current location.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    // Stop watching location when component is removed
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  if (loadError) {
    return (
      <div className="rounded-3xl border bg-card p-6 text-center">
        <p className="font-semibold">Unable to load Google Maps</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your Google Maps API key and enabled APIs.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="rounded-3xl border bg-card p-6 text-center">
        <p className="text-sm font-semibold">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-3xl border shadow-soft">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={location}
          zoom={15}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          <MarkerF
            position={location}
            title="Your current location"
          />
        </GoogleMap>
      </div>

      {locationError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {locationError}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        📍 Your location is updated in real time
      </p>
    </div>
  );
}