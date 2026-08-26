import type { SafePathLocation } from "@/data/safepath";

type GeocodeResult = {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  category?: string;
  importance?: number;
  address?: { city?: string; town?: string; village?: string; state?: string; country?: string };
};

export type PlaceFacts = {
  description: string;
  category: string;
  source: string;
  sourceUrl: string;
};

export async function geocodeDestination(query: string): Promise<SafePathLocation> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error("Destination search is unavailable right now.");
  const results = (await response.json()) as GeocodeResult[];
  const result = results[0];
  if (!result) throw new Error("We could not find that destination. Try adding a city or country.");

  const seed = hash(query);
  const city = result.address?.city ?? result.address?.town ?? result.address?.village ?? result.address?.country ?? "Unknown area";
  const state = result.address?.state ?? result.address?.country ?? "Unknown region";
  const facts = await fetchPlaceFacts(result.display_name, result.type, result.category);
  const base = 62 + (seed % 23);
  const factor = (key: string, spread = 12) => clamp(base + ((hash(`${query}-${key}`) % (spread * 2 + 1)) - spread));
  const factors = {
    crime: F("Estimated baseline", factor("crime"), "No destination-specific crime feed is connected; this is a conservative baseline."),
    weather: F("Awaiting live data", 70, "Live weather is fetched for this destination when a weather API key is configured."),
    traffic: F("Route estimate", factor("traffic"), "Traffic risk is estimated until live route conditions are available."),
    crowd: F("Estimated baseline", factor("crowd"), "Crowd density is estimated from the destination search, not a live crowd sensor."),
    lighting: F("Estimated baseline", factor("lighting"), "Lighting coverage requires local data and is currently estimated."),
    road: F("Route estimate", factor("road"), "Road condition is estimated until a local road-safety source is connected."),
    women: F("Estimated baseline", factor("women"), "Women safety data is not available for this destination yet."),
    police: F("Estimated baseline", factor("police"), "Police presence is estimated; verify nearby services before travel."),
    reports: F("No local feed", factor("reports"), "No destination-specific community report feed was returned."),
    transport: F("Estimated baseline", factor("transport"), "Transport availability is estimated from location data."),
    response: F("Estimated baseline", factor("response"), "Emergency response time is estimated until nearby services are loaded."),
    night: F("Estimated baseline", factor("night"), "Night visibility is estimated from the general location baseline."),
    flood: F("Estimated baseline", factor("flood"), "Flood risk requires a local hazard source and is currently estimated."),
    construction: F("No local feed", factor("construction"), "No destination-specific construction feed was returned."),
    air: F("Awaiting live data", factor("air"), "Air quality requires a configured live air-quality source."),
  };
  const values = Object.values(factors);
  const score = Math.round(values.reduce((sum, item) => sum + item.value, 0) / values.length);

  return {
    id: `geocoded-${hash(`${result.lat}-${result.lon}`)}`,
    name: result.display_name.split(",").slice(0, 2).join(","),
    city,
    state,
    lat: Number(result.lat),
    lng: Number(result.lon),
    score,
    tags: ["Geocoded destination", facts.category],
    facts,
    factors,
    crimeIndex: 100 - factors.crime.value,
    responseMin: Math.max(4, Math.round((100 - factors.response.value) / 5)),
    services: [],
  };
}

function F(status: string, value: number, note: string) {
  return { status, value, note };
}

function hash(value: string) {
  return Array.from(value).reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function clamp(value: number) {
  return Math.max(30, Math.min(96, value));
}

async function fetchPlaceFacts(displayName: string, type?: string, category?: string): Promise<PlaceFacts> {
  const label = displayName.split(",")[0]?.trim() || "This destination";
  const fallback: PlaceFacts = {
    description: `Located at ${displayName}. Detailed public place information was not available for this search.`,
    category: category ?? type ?? "Place",
    source: "OpenStreetMap",
    sourceUrl: "https://www.openstreetmap.org/",
  };

  try {
    const searchResponse = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(label)}&srlimit=1&format=json&origin=*`,
    );
    if (!searchResponse.ok) return fallback;
    const searchData = (await searchResponse.json()) as { query?: { search?: { title: string }[] } };
    const title = searchData.query?.search?.[0]?.title;
    if (!title) return fallback;

    const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!summaryResponse.ok) return fallback;
    const summary = (await summaryResponse.json()) as { extract?: string; content_urls?: { desktop?: { page?: string } } };
    return {
      description: summary.extract || fallback.description,
      category: category ?? type ?? "Place",
      source: "Wikipedia + OpenStreetMap",
      sourceUrl: summary.content_urls?.desktop?.page || fallback.sourceUrl,
    };
  } catch {
    return fallback;
  }
}