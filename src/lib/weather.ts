import { useEffect, useState } from "react";

export type WeatherSnapshot = {
  temperature: number;
  condition: string;
  windKph: number;
  visibilityKm: number | null;
  risk: "Low" | "Moderate" | "High";
};

export function useRouteWeather(lat?: number, lng?: number) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const key = import.meta.env.VITE_WEATHER_API_KEY;
    if (!key || lat == null || lng == null) {
      setWeather(null);
      setUnavailable(Boolean(lat != null));
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setUnavailable(false);
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${key}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Weather service unavailable");
        const data = await response.json() as { main: { temp: number }; weather: { main: string; description: string }[]; wind: { speed: number }; visibility?: number };
        const condition = data.weather[0]?.description ?? data.weather[0]?.main ?? "Unknown";
        const isHigh = /rain|storm|thunder|fog/i.test(condition) || (data.wind.speed ?? 0) > 12;
        setWeather({
          temperature: Math.round(data.main.temp),
          condition,
          windKph: Math.round((data.wind.speed ?? 0) * 3.6),
          visibilityKm: data.visibility == null ? null : Number((data.visibility / 1000).toFixed(1)),
          risk: isHigh ? "High" : /cloud|mist/i.test(condition) ? "Moderate" : "Low",
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setWeather(null);
          setUnavailable(true);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [lat, lng]);

  return { weather, loading, unavailable };
}
