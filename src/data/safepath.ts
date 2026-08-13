export type FactorKey =
  | "crime"
  | "weather"
  | "traffic"
  | "crowd"
  | "lighting"
  | "road"
  | "women"
  | "police"
  | "reports"
  | "transport"
  | "response"
  | "night"
  | "flood"
  | "construction"
  | "air";

export type Factor = {
  key: FactorKey;
  label: string;
  status: string;
  /** 0-100 contribution quality (higher = safer) */
  value: number;
  impact: number;
  confidence: number;
  note: string;
};

export type ServiceKind =
  | "police"
  | "hospital"
  | "ambulance"
  | "pharmacy"
  | "fire"
  | "shelter"
  | "fuel"
  | "toilet"
  | "help";

export type NearbyService = {
  id: string;
  kind: ServiceKind;
  name: string;
  distanceKm: number;
  etaMin: number;
  open: boolean;
  phone: string;
  x: number;
  y: number;
};

export type SafePathLocation = {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  score: number;
  tags: string[];
  factors: Record<FactorKey, { status: string; value: number; note: string }>;
  crimeIndex: number;
  responseMin: number;
  services: NearbyService[];
};

const F = (status: string, value: number, note: string) => ({ status, value, note });

export const FACTOR_META: {
  key: FactorKey;
  label: string;
  icon: string;
  weight: number;
}[] = [
  { key: "crime", label: "Crime History", icon: "shield", weight: 14 },
  { key: "weather", label: "Weather", icon: "cloud", weight: 6 },
  { key: "traffic", label: "Traffic", icon: "car", weight: 8 },
  { key: "crowd", label: "Crowd Density", icon: "users", weight: 6 },
  { key: "lighting", label: "Street Lighting", icon: "lamp", weight: 9 },
  { key: "road", label: "Road Condition", icon: "route", weight: 7 },
  { key: "women", label: "Women Safety", icon: "heart", weight: 12 },
  { key: "police", label: "Police Presence", icon: "badge", weight: 10 },
  { key: "reports", label: "Emergency Reports", icon: "siren", weight: 8 },
  { key: "transport", label: "Public Transport", icon: "bus", weight: 5 },
  { key: "response", label: "Response Time", icon: "timer", weight: 6 },
  { key: "night", label: "Night Visibility", icon: "moon", weight: 6 },
  { key: "flood", label: "Flood Risk", icon: "waves", weight: 5 },
  { key: "construction", label: "Construction", icon: "cone", weight: 3 },
  { key: "air", label: "Air Quality", icon: "wind", weight: 3 },
];

const svc = (
  id: string,
  kind: ServiceKind,
  name: string,
  distanceKm: number,
  x: number,
  y: number,
  open = true,
): NearbyService => ({
  id,
  kind,
  name,
  distanceKm,
  etaMin: Math.max(2, Math.round(distanceKm * 3.2)),
  open,
  phone: kind === "police" ? "100" : kind === "hospital" ? "108" : "112",
  x,
  y,
});

function mkServices(prefix: string, seed: number): NearbyService[] {
  const r = (i: number) => Number((((seed * (i + 3)) % 47) / 10 + 0.4).toFixed(1));
  const px = (i: number) => 20 + ((seed * (i + 5)) % 60);
  const py = (i: number) => 18 + ((seed * (i + 11)) % 62);
  const defs: [ServiceKind, string][] = [
    ["police", "City Police Station"],
    ["hospital", "Government General Hospital"],
    ["ambulance", "108 Ambulance Point"],
    ["pharmacy", "Apollo Pharmacy 24x7"],
    ["fire", "Fire & Rescue Station"],
    ["shelter", "Municipal Relief Shelter"],
    ["fuel", "Indian Oil Petrol Bunk"],
    ["toilet", "Public Convenience Block"],
    ["help", "Traveller Help Desk"],
  ];
  return defs.map(([kind, name], i) =>
    svc(`${prefix}-${kind}`, kind, `${name}`, r(i), px(i), py(i), i !== 7),
  );
}

export const LOCATIONS: SafePathLocation[] = [
  {
    id: "chennai-central",
    name: "Chennai Railway Station (Central)",
    city: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2757,
    score: 78,
    tags: ["Transit hub", "24x7 police post"],
    crimeIndex: 34,
    responseMin: 6,
    factors: {
      crime: F("Moderate", 66, "Pickpocketing reported near platform exits after 22:00."),
      weather: F("Light rain", 72, "Drizzle expected for the next 2 hours."),
      traffic: F("Heavy", 48, "EVR Periyar Salai congested during peak hours."),
      crowd: F("Very high", 45, "Peak passenger movement between 18:00 and 22:00."),
      lighting: F("Excellent", 92, "Full LED coverage across concourse and approach roads."),
      road: F("Good", 84, "Recently resurfaced approach roads."),
      women: F("Good", 80, "Dedicated women help desk and CCTV coverage."),
      police: F("High", 94, "Railway Protection Force patrols every 15 minutes."),
      reports: F("2 active", 62, "Two minor theft reports in the last 7 days."),
      transport: F("Excellent", 96, "Metro, suburban rail, MTC bus and autos available."),
      response: F("6 min", 88, "Nearest control room 1.2 km away."),
      night: F("Good", 82, "Well lit until 01:00, reduced coverage after."),
      flood: F("Low", 86, "Improved storm water drains since 2021."),
      construction: F("Minor", 74, "Metro Phase-2 works on the north entrance."),
      air: F("AQI 96", 64, "Moderate particulate levels near the bus bay."),
    },
    services: mkServices("chn-central", 7),
  },
  {
    id: "chennai-airport",
    name: "Chennai International Airport",
    city: "Chennai",
    state: "Tamil Nadu",
    lat: 12.9941,
    lng: 80.1709,
    score: 87,
    tags: ["High security", "CISF patrol"],
    crimeIndex: 12,
    responseMin: 4,
    factors: {
      crime: F("Very low", 94, "Negligible incidents inside the secured perimeter."),
      weather: F("Clear", 90, "Clear skies with 12 km visibility."),
      traffic: F("Moderate", 70, "GST Road slows near the departure ramp."),
      crowd: F("Managed", 80, "Queue management systems in place."),
      lighting: F("Excellent", 96, "High mast lighting across all approach roads."),
      road: F("Excellent", 94, "Six-lane access with clear signage."),
      women: F("Excellent", 92, "Female security staff and monitored waiting zones."),
      police: F("Very high", 97, "CISF plus airport police outpost on site."),
      reports: F("None", 95, "No community reports in the last 30 days."),
      transport: F("Excellent", 93, "Metro line, prepaid taxis and airport buses."),
      response: F("4 min", 93, "On-campus medical and fire response."),
      night: F("Excellent", 94, "24x7 illumination."),
      flood: F("Low", 82, "Adyar river overflow risk only in extreme monsoon."),
      construction: F("None", 92, "No active works on access roads."),
      air: F("AQI 71", 76, "Satisfactory air quality."),
    },
    services: mkServices("chn-air", 11),
  },
  {
    id: "marina-beach",
    name: "Marina Beach",
    city: "Chennai",
    state: "Tamil Nadu",
    lat: 13.0499,
    lng: 80.2824,
    score: 64,
    tags: ["Tourist zone", "Evening crowd"],
    crimeIndex: 48,
    responseMin: 9,
    factors: {
      crime: F("Elevated", 52, "Chain snatching reported along the service road."),
      weather: F("Windy", 68, "Strong sea breeze, occasional showers."),
      traffic: F("Heavy", 46, "Kamarajar Salai jams every evening."),
      crowd: F("Extreme", 35, "Weekend footfall exceeds 40,000."),
      lighting: F("Patchy", 55, "Sand stretch beyond 100 m is poorly lit."),
      road: F("Fair", 68, "Service lanes have sand accumulation."),
      women: F("Moderate", 58, "Avoid isolated sand stretches after 21:00."),
      police: F("Moderate", 72, "Beach patrol until 23:00."),
      reports: F("5 active", 44, "Five community reports this week."),
      transport: F("Good", 82, "MTC buses and shared autos frequent."),
      response: F("9 min", 68, "Ambulance access limited on the sand."),
      night: F("Poor", 42, "Dark zones near the shoreline."),
      flood: F("Moderate", 60, "Sea surge during cyclonic alerts."),
      construction: F("Minor", 78, "Promenade restoration in two blocks."),
      air: F("AQI 58", 84, "Good coastal air quality."),
    },
    services: mkServices("marina", 13),
  },
  {
    id: "coimbatore-bus",
    name: "Coimbatore Gandhipuram Bus Stand",
    city: "Coimbatore",
    state: "Tamil Nadu",
    lat: 11.0168,
    lng: 76.9558,
    score: 72,
    tags: ["Transit hub"],
    crimeIndex: 38,
    responseMin: 7,
    factors: {
      crime: F("Moderate", 64, "Occasional baggage theft at night bays."),
      weather: F("Cloudy", 80, "Pleasant 26°C with light cloud cover."),
      traffic: F("Heavy", 50, "Cross Cut Road heavily congested."),
      crowd: F("High", 52, "Continuous crowd from 06:00 to 23:00."),
      lighting: F("Good", 82, "Platform lighting upgraded in 2023."),
      road: F("Good", 80, "Minor potholes near bay 12."),
      women: F("Good", 76, "Women waiting hall with attendant."),
      police: F("Good", 84, "Bus stand police booth staffed 24x7."),
      reports: F("1 active", 74, "One roadblock report nearby."),
      transport: F("Excellent", 94, "State and private buses every 2 minutes."),
      response: F("7 min", 82, "Two hospitals within 3 km."),
      night: F("Fair", 68, "Rear bays dimly lit past midnight."),
      flood: F("Low", 88, "Well drained terrain."),
      construction: F("Active", 62, "Flyover work on Dr Nanjappa Road."),
      air: F("AQI 84", 70, "Moderate, diesel exhaust near bays."),
    },
    services: mkServices("cbe-bus", 17),
  },
  {
    id: "erode-railway",
    name: "Erode Junction Railway Station",
    city: "Erode",
    state: "Tamil Nadu",
    lat: 11.3428,
    lng: 77.7274,
    score: 81,
    tags: ["Calm transit"],
    crimeIndex: 22,
    responseMin: 6,
    factors: {
      crime: F("Low", 84, "Very few reported incidents this quarter."),
      weather: F("Clear", 90, "Hot and dry, 33°C."),
      traffic: F("Light", 84, "Station road flows freely."),
      crowd: F("Moderate", 74, "Manageable footfall outside peak trains."),
      lighting: F("Good", 84, "Full platform and parking lighting."),
      road: F("Good", 82, "Smooth approach from Perundurai Road."),
      women: F("Good", 82, "RPF women constables on night shift."),
      police: F("Good", 86, "GRP outpost inside the station."),
      reports: F("None", 92, "No open reports."),
      transport: F("Good", 84, "Town buses and autos available till 23:30."),
      response: F("6 min", 86, "Government hospital 2.1 km away."),
      night: F("Good", 80, "Adequate visibility on all platforms."),
      flood: F("Low", 90, "No history of waterlogging."),
      construction: F("None", 92, "No active works."),
      air: F("AQI 62", 82, "Satisfactory."),
    },
    services: mkServices("erode", 19),
  },
  {
    id: "ooty-bus",
    name: "Ooty Bus Stand",
    city: "Udhagamandalam",
    state: "Tamil Nadu",
    lat: 11.4102,
    lng: 76.6950,
    score: 69,
    tags: ["Hill route", "Fog risk"],
    crimeIndex: 18,
    responseMin: 12,
    factors: {
      crime: F("Low", 88, "Tourist area with low crime rate."),
      weather: F("Dense fog", 44, "Visibility below 200 m after 17:00."),
      traffic: F("Moderate", 66, "Ghat road congestion in tourist season."),
      crowd: F("High", 58, "Seasonal tourist rush."),
      lighting: F("Fair", 64, "Limited lighting on ghat sections."),
      road: F("Fair", 60, "Hairpin bends with wet surface."),
      women: F("Good", 80, "Generally safe, avoid late ghat travel."),
      police: F("Moderate", 72, "Tourist police patrols during the day."),
      reports: F("2 active", 62, "Landslip warning on Kotagiri road."),
      transport: F("Moderate", 70, "Buses reduce sharply after 20:00."),
      response: F("12 min", 58, "Hilly terrain slows ambulances."),
      night: F("Poor", 46, "Fog plus low lighting on approach roads."),
      flood: F("Moderate", 62, "Slope runoff during heavy rain."),
      construction: F("Minor", 76, "Retaining wall repairs."),
      air: F("AQI 34", 96, "Excellent mountain air."),
    },
    services: mkServices("ooty", 23),
  },
  {
    id: "bengaluru-majestic",
    name: "Bengaluru Majestic (Kempegowda)",
    city: "Bengaluru",
    state: "Karnataka",
    lat: 12.9776,
    lng: 77.5713,
    score: 61,
    tags: ["Very busy", "Pickpocket alert"],
    crimeIndex: 56,
    responseMin: 8,
    factors: {
      crime: F("High", 44, "Frequent pickpocketing and phone snatching."),
      weather: F("Light rain", 72, "Intermittent showers."),
      traffic: F("Severe", 34, "Gubbi Thotadappa Road gridlocked."),
      crowd: F("Extreme", 32, "One of India's busiest interchanges."),
      lighting: F("Good", 78, "Bright but with blind corners."),
      road: F("Fair", 62, "Uneven surface near bus bays."),
      women: F("Moderate", 54, "Crowd pressure at night; use prepaid autos."),
      police: F("High", 86, "City police outpost plus BMTC marshals."),
      reports: F("7 active", 38, "Seven reports in the last 72 hours."),
      transport: F("Excellent", 97, "Metro, KSRTC, BMTC all interconnected."),
      response: F("8 min", 76, "Victoria Hospital 2.4 km."),
      night: F("Fair", 64, "Busy through the night, remain alert."),
      flood: F("Moderate", 62, "Underpass waterlogging in monsoon."),
      construction: F("Active", 58, "Metro and skywalk works."),
      air: F("AQI 112", 52, "Unhealthy for sensitive groups."),
    },
    services: mkServices("blr-maj", 29),
  },
  {
    id: "kongu-engineering",
    name: "Kongu Engineering College, Perundurai",
    city: "Erode",
    state: "Tamil Nadu",
    lat: 11.2748,
    lng: 77.6069,
    score: 93,
    tags: ["Campus", "Very safe"],
    crimeIndex: 8,
    responseMin: 7,
    factors: {
      crime: F("Very low", 96, "No incidents recorded near the campus."),
      weather: F("Clear", 90, "Sunny, 31°C."),
      traffic: F("Light", 90, "Free flowing on Perundurai–Thoppupalayam road."),
      crowd: F("Low", 88, "Campus crowd only at shift timings."),
      lighting: F("Excellent", 94, "Campus and highway lighting."),
      road: F("Excellent", 92, "Well maintained state highway."),
      women: F("Excellent", 94, "Campus security and hostel escort service."),
      police: F("Moderate", 76, "Perundurai station 4.6 km away."),
      reports: F("None", 96, "No community reports."),
      transport: F("Good", 78, "College buses and town buses on NH-544."),
      response: F("7 min", 84, "Perundurai medical college nearby."),
      night: F("Good", 86, "Highway well lit."),
      flood: F("Very low", 94, "Elevated terrain."),
      construction: F("None", 94, "No works."),
      air: F("AQI 48", 90, "Good."),
    },
    services: mkServices("kongu", 31),
  },
  {
    id: "madurai-meenakshi",
    name: "Madurai Meenakshi Temple",
    city: "Madurai",
    state: "Tamil Nadu",
    lat: 9.9195,
    lng: 78.1193,
    score: 74,
    tags: ["Heritage", "Festival crowd"],
    crimeIndex: 30,
    responseMin: 8,
    factors: {
      crime: F("Moderate", 70, "Petty theft during festival days."),
      weather: F("Hot", 68, "38°C, heat advisory 12:00–16:00."),
      traffic: F("Heavy", 52, "Narrow Masi streets restrict movement."),
      crowd: F("Very high", 44, "Continuous pilgrim flow."),
      lighting: F("Good", 82, "Temple corridors brightly lit."),
      road: F("Fair", 66, "Old town lanes are narrow."),
      women: F("Good", 78, "Separate queues and volunteers."),
      police: F("High", 88, "Temple police unit deployed."),
      reports: F("3 active", 56, "Crowd surge alerts."),
      transport: F("Good", 84, "Buses and autos plentiful."),
      response: F("8 min", 78, "Ambulance bay at east tower."),
      night: F("Good", 80, "Lit until 22:30."),
      flood: F("Low", 86, "Rare waterlogging."),
      construction: F("Minor", 80, "Corridor restoration."),
      air: F("AQI 76", 74, "Moderate."),
    },
    services: mkServices("mdu", 37),
  },
  {
    id: "hyderabad-charminar",
    name: "Charminar, Hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    lat: 17.3616,
    lng: 78.4747,
    score: 58,
    tags: ["Dense market", "Night caution"],
    crimeIndex: 58,
    responseMin: 11,
    factors: {
      crime: F("Elevated", 48, "Snatching reported in Laad Bazaar lanes."),
      weather: F("Clear", 86, "Dry, 32°C."),
      traffic: F("Severe", 32, "Market lanes almost impassable by car."),
      crowd: F("Extreme", 30, "Shoulder-to-shoulder in evenings."),
      lighting: F("Fair", 62, "Bright main square, dark side lanes."),
      road: F("Poor", 48, "Uneven cobbled surface."),
      women: F("Moderate", 52, "Travel in groups after 20:00."),
      police: F("Moderate", 70, "Beat patrols in the main square."),
      reports: F("6 active", 42, "Six reports this week."),
      transport: F("Moderate", 68, "Autos only; no metro access."),
      response: F("11 min", 58, "Narrow lanes delay ambulances."),
      night: F("Poor", 46, "Poorly lit interior lanes."),
      flood: F("Moderate", 64, "Old drainage overflows."),
      construction: F("Active", 60, "Pedestrianisation project."),
      air: F("AQI 128", 46, "Unhealthy."),
    },
    services: mkServices("hyd", 41),
  },
  {
    id: "mumbai-gateway",
    name: "Gateway of India, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    lat: 18.9220,
    lng: 72.8347,
    score: 83,
    tags: ["Tourist", "Heavy security"],
    crimeIndex: 20,
    responseMin: 5,
    factors: {
      crime: F("Low", 86, "Strong surveillance since 2009."),
      weather: F("Humid", 72, "High humidity, coastal breeze."),
      traffic: F("Moderate", 66, "Colaba Causeway slow in evenings."),
      crowd: F("High", 58, "Tourist peak 17:00–21:00."),
      lighting: F("Excellent", 92, "Heritage lighting across the precinct."),
      road: F("Good", 84, "Well maintained."),
      women: F("Good", 84, "Visible police and CCTV."),
      police: F("Very high", 94, "Armed police plus coastal security."),
      reports: F("1 active", 78, "One crowd alert."),
      transport: F("Good", 84, "Taxis, ferries and buses."),
      response: F("5 min", 90, "St George Hospital 1.5 km."),
      night: F("Good", 86, "Well lit promenade."),
      flood: F("Moderate", 62, "High tide plus monsoon flooding risk."),
      construction: F("None", 90, "No works."),
      air: F("AQI 92", 66, "Moderate."),
    },
    services: mkServices("mum", 43),
  },
  {
    id: "delhi-connaught",
    name: "Connaught Place, New Delhi",
    city: "New Delhi",
    state: "Delhi",
    lat: 28.6315,
    lng: 77.2167,
    score: 70,
    tags: ["Business hub"],
    crimeIndex: 40,
    responseMin: 7,
    factors: {
      crime: F("Moderate", 64, "Vehicle theft in outer circle parking."),
      weather: F("Smoggy", 52, "Winter smog reduces visibility."),
      traffic: F("Heavy", 50, "Radial roads congested."),
      crowd: F("High", 58, "Office and shopping crowd."),
      lighting: F("Excellent", 90, "Colonnade fully lit."),
      road: F("Good", 84, "Smooth circular roads."),
      women: F("Moderate", 62, "Use app cabs after 22:00."),
      police: F("High", 88, "PCR vans stationed at each block."),
      reports: F("4 active", 52, "Four reports this week."),
      transport: F("Excellent", 96, "Rajiv Chowk metro interchange."),
      response: F("7 min", 82, "RML Hospital 2.8 km."),
      night: F("Good", 78, "Busy until late."),
      flood: F("Low", 84, "Rare waterlogging in inner circle."),
      construction: F("Minor", 78, "Streetscape upgrade."),
      air: F("AQI 186", 28, "Poor — mask advised."),
    },
    services: mkServices("del", 47),
  },
];

export type CommunityAlert = {
  id: string;
  type:
    | "accident"
    | "crime"
    | "roadblock"
    | "flood"
    | "traffic"
    | "rain"
    | "event"
    | "crowd"
    | "fire"
    | "medical";
  title: string;
  detail: string;
  place: string;
  severity: "low" | "medium" | "high";
  minutesAgo: number;
};

export const COMMUNITY_ALERTS: CommunityAlert[] = [
  {
    id: "a1",
    type: "accident",
    title: "Two-wheeler collision",
    detail: "Minor accident near the subway entrance, one lane blocked.",
    place: "Chennai Central",
    severity: "medium",
    minutesAgo: 12,
  },
  {
    id: "a2",
    type: "rain",
    title: "Heavy rainfall warning",
    detail: "IMD orange alert for the next 4 hours across coastal districts.",
    place: "Marina Beach",
    severity: "high",
    minutesAgo: 26,
  },
  {
    id: "a3",
    type: "crime",
    title: "Chain snatching reported",
    detail: "Two incidents reported near the service road in the last 24 hours.",
    place: "Marina Beach",
    severity: "high",
    minutesAgo: 48,
  },
  {
    id: "a4",
    type: "roadblock",
    title: "Metro work diversion",
    detail: "North entrance closed, use the Wall Tax Road diversion.",
    place: "Chennai Central",
    severity: "low",
    minutesAgo: 75,
  },
  {
    id: "a5",
    type: "crowd",
    title: "Festival crowd surge",
    detail: "Expect very high footfall between 18:00 and 22:00.",
    place: "Madurai Meenakshi Temple",
    severity: "medium",
    minutesAgo: 96,
  },
  {
    id: "a6",
    type: "flood",
    title: "Underpass waterlogging",
    detail: "Knee deep water reported, avoid the underpass.",
    place: "Bengaluru Majestic",
    severity: "high",
    minutesAgo: 130,
  },
  {
    id: "a7",
    type: "traffic",
    title: "Severe congestion",
    detail: "Average speed under 8 km/h on the approach road.",
    place: "Coimbatore Gandhipuram",
    severity: "medium",
    minutesAgo: 160,
  },
  {
    id: "a8",
    type: "event",
    title: "Public rally permitted",
    detail: "Traffic restrictions from 16:00 to 20:00.",
    place: "Connaught Place",
    severity: "low",
    minutesAgo: 210,
  },
];

export type AiNotification = {
  id: string;
  title: string;
  body: string;
  kind: "weather" | "safety" | "traffic" | "police" | "crowd" | "emergency";
  minutesAgo: number;
};

export const AI_NOTIFICATIONS: AiNotification[] = [
  {
    id: "n1",
    kind: "weather",
    title: "Heavy Rain Ahead",
    body: "Rainfall of 24 mm/h expected on your route in 20 minutes. Reduce speed.",
    minutesAgo: 3,
  },
  {
    id: "n2",
    kind: "safety",
    title: "Accident Reported",
    body: "A collision was reported 1.4 km ahead. SafePath re-routed you automatically.",
    minutesAgo: 9,
  },
  {
    id: "n3",
    kind: "safety",
    title: "High Crime Area",
    body: "You are approaching a zone with elevated snatching reports after 21:00.",
    minutesAgo: 22,
  },
  {
    id: "n4",
    kind: "crowd",
    title: "Festival Crowd",
    body: "Very high footfall detected near your destination. Allow +14 minutes.",
    minutesAgo: 41,
  },
  {
    id: "n5",
    kind: "traffic",
    title: "Road Closure",
    body: "Wall Tax Road closed for metro works until 22:00.",
    minutesAgo: 63,
  },
  {
    id: "n6",
    kind: "weather",
    title: "Flood Warning",
    body: "Low lying stretches may flood. Avoid the underpass on Route B.",
    minutesAgo: 88,
  },
  {
    id: "n7",
    kind: "police",
    title: "Police Advisory",
    body: "Night patrol increased in your area. Emergency response time improved to 5 min.",
    minutesAgo: 120,
  },
  {
    id: "n8",
    kind: "emergency",
    title: "Emergency Weather Alert",
    body: "IMD orange alert issued for coastal Tamil Nadu for the next 6 hours.",
    minutesAgo: 180,
  },
];

export const INCIDENT_CATEGORIES = [
  "Accident",
  "Theft",
  "Harassment",
  "Suspicious Activity",
  "Unsafe Area",
  "Roadblock",
  "Flood",
  "Fire",
  "Broken Streetlight",
  "Medical Emergency",
  "Other Hazard",
] as const;

export const ACHIEVEMENTS = [
  { id: "guardian", label: "Community Guardian", detail: "12 verified reports" },
  { id: "night", label: "Night Navigator", detail: "25 safe night trips" },
  { id: "streak", label: "30-day Safe Streak", detail: "No high-risk routes" },
  { id: "helper", label: "First Responder", detail: "3 SOS assists nearby" },
];

export const WEEKLY_TREND = [
  { day: "Mon", score: 74 },
  { day: "Tue", score: 79 },
  { day: "Wed", score: 71 },
  { day: "Thu", score: 83 },
  { day: "Fri", score: 68 },
  { day: "Sat", score: 62 },
  { day: "Sun", score: 88 },
];

export const MONTHLY_TRIPS = [
  { month: "Jan", trips: 18, safe: 14 },
  { month: "Feb", trips: 22, safe: 17 },
  { month: "Mar", trips: 26, safe: 21 },
  { month: "Apr", trips: 19, safe: 16 },
  { month: "May", trips: 31, safe: 26 },
  { month: "Jun", trips: 28, safe: 24 },
];

export const RISK_DISTRIBUTION = [
  { name: "Safe", value: 68 },
  { name: "Moderate", value: 24 },
  { name: "High Risk", value: 8 },
];

export function findLocations(query: string): SafePathLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return LOCATIONS.slice(0, 6);
  return LOCATIONS.filter((l) =>
    `${l.name} ${l.city} ${l.state} ${l.tags.join(" ")}`.toLowerCase().includes(q),
  );
}

export function scoreBand(score: number): "safe" | "moderate" | "risk" {
  return score >= 78 ? "safe" : score >= 60 ? "moderate" : "risk";
}

export function bandColor(score: number) {
  const b = scoreBand(score);
  return b === "safe"
    ? "var(--color-safe)"
    : b === "moderate"
      ? "var(--color-warn)"
      : "var(--color-danger)";
}

export function buildFactors(loc: SafePathLocation): Factor[] {
  return FACTOR_META.map((m) => {
    const f = loc.factors[m.key];
    const impact = Math.round(((100 - f.value) * m.weight) / 100);
    return {
      key: m.key,
      label: m.label,
      status: f.status,
      value: f.value,
      impact,
      confidence: Math.min(99, 72 + ((f.value + m.weight * 3) % 26)),
      note: f.note,
    };
  });
}

export function aiSummary(loc: SafePathLocation): string {
  const band = scoreBand(loc.score);
  const f = loc.factors;
  const strengths = FACTOR_META.filter((m) => loc.factors[m.key].value >= 84)
    .slice(0, 3)
    .map((m) => m.label.toLowerCase());
  const risks = FACTOR_META.filter((m) => loc.factors[m.key].value <= 55)
    .slice(0, 3)
    .map((m) => m.label.toLowerCase());

  const head =
    band === "safe"
      ? `${loc.name} is considered safe for travel right now.`
      : band === "moderate"
        ? `${loc.name} carries moderate risk at this hour.`
        : `${loc.name} is currently rated high risk — travel with caution.`;

  const good = strengths.length
    ? ` SafePath AI weighted this positively because of ${strengths.join(", ")}.`
    : "";
  const bad = risks.length
    ? ` The score is pulled down by ${risks.join(", ")}.`
    : " No significant negative factors were detected.";
  const weather = ` Weather is currently ${f.weather.status.toLowerCase()} and traffic is ${f.traffic.status.toLowerCase()}.`;
  const advice =
    band === "safe"
      ? " The safest recommended route keeps you on well lit arterial roads with active police patrols."
      : band === "moderate"
        ? " The safest recommended route avoids crowded intersections and poorly lit shortcuts."
        : " Prefer daylight travel, share your live location, and keep the SOS button ready.";

  return head + good + bad + weather + advice;
}

export type RouteOption = {
  id: "safest" | "fastest" | "balanced";
  name: string;
  minutes: number;
  km: number;
  score: number;
  traffic: string;
  road: string;
  lighting: string;
  weather: string;
  crowd: string;
  toll: string;
  accidents: string;
  path: string;
  color: string;
  reasons: string[];
};

export function buildRoutes(loc: SafePathLocation): RouteOption[] {
  const base = 18 + (loc.crimeIndex % 17);
  const safest: RouteOption = {
    id: "safest",
    name: "Safest Route",
    minutes: base + 9,
    km: Number((base * 0.62 + 3.4).toFixed(1)),
    score: Math.min(98, loc.score + 11),
    traffic: "Moderate",
    road: loc.factors.road.status,
    lighting: "Well lit arterial roads",
    weather: loc.factors.weather.status,
    crowd: "Low to moderate",
    toll: "No toll",
    accidents: "1 minor incident in 90 days",
    color: "var(--color-safe)",
    path: "M 40 300 C 90 230, 120 250, 160 190 S 230 120, 300 96",
    reasons: [
      "Passes 3 police patrol corridors with 24x7 beat coverage",
      "94% of the route has verified street lighting",
      "Avoids two intersections with elevated accident history",
      "Two hospitals lie within 1.5 km of the corridor",
    ],
  };
  const fastest: RouteOption = {
    id: "fastest",
    name: "Fastest Route",
    minutes: base,
    km: Number((base * 0.52 + 2.1).toFixed(1)),
    score: Math.max(28, loc.score - 14),
    traffic: "Heavy at 2 junctions",
    road: "Mixed",
    lighting: "Partially lit shortcut",
    weather: loc.factors.weather.status,
    crowd: "High near market stretch",
    toll: "₹45 toll",
    accidents: "6 incidents in 90 days",
    color: "var(--color-warn)",
    path: "M 40 300 C 120 300, 150 200, 200 170 S 260 130, 300 96",
    reasons: [
      "Shortest distance using the bypass shortcut",
      "Includes a 1.2 km stretch with poor lighting after 21:00",
      "Higher accident density near the market junction",
      "Saves 9 minutes but reduces the safety score by 14 points",
    ],
  };
  const balanced: RouteOption = {
    id: "balanced",
    name: "Balanced Route",
    minutes: base + 4,
    km: Number((base * 0.57 + 2.8).toFixed(1)),
    score: Math.min(94, loc.score + 3),
    traffic: "Light",
    road: "Good",
    lighting: "Mostly lit",
    weather: loc.factors.weather.status,
    crowd: "Moderate",
    toll: "No toll",
    accidents: "3 incidents in 90 days",
    color: "var(--color-primary)",
    path: "M 40 300 C 70 250, 150 280, 190 210 S 250 150, 300 96",
    reasons: [
      "Best trade-off between travel time and safety",
      "Uses main roads with continuous public transport coverage",
      "Moderate crowd density keeps visibility high",
    ],
  };
  return [safest, balanced, fastest];
}

export function chatAnswer(question: string, loc: SafePathLocation | null): string {
  const q = question.toLowerCase();
  const L = loc ?? LOCATIONS[0];
  if (/hospital|medical|ambulance/.test(q)) {
    const h = L.services.find((s) => s.kind === "hospital")!;
    return `The nearest hospital to ${L.name} is **${h.name}**, about ${h.distanceKm} km away (~${h.etaMin} min). An ambulance point is ${L.services.find((s) => s.kind === "ambulance")!.distanceKm} km away and the average emergency response time in this zone is ${L.responseMin} minutes. Dial 108 for ambulance support.`;
  }
  if (/police|station/.test(q)) {
    const p = L.services.find((s) => s.kind === "police")!;
    return `**${p.name}** is ${p.distanceKm} km from ${L.name} (~${p.etaMin} min). Police presence here is rated **${L.factors.police.status}** — ${L.factors.police.note}`;
  }
  if (/night|10 ?pm|after dark|late/.test(q)) {
    const ok = L.factors.night.value >= 70 && L.factors.lighting.value >= 70;
    return `${ok ? "Yes — " : "Use caution. "}Night visibility at ${L.name} is rated **${L.factors.night.status}** and street lighting is **${L.factors.lighting.status}**. ${L.factors.night.note} Women safety is rated ${L.factors.women.status.toLowerCase()}. ${ok ? "Stick to the main road and you should be fine." : "Prefer app-based cabs and travel in a group."}`;
  }
  if (/safest route|which route|best route/.test(q)) {
    const r = buildRoutes(L)[0];
    return `The **Safest Route** to ${L.name} takes ${r.minutes} min over ${r.km} km with a safety score of **${r.score}/100**. ${r.reasons[0]} and ${r.reasons[1].toLowerCase()}. The fastest option saves about 9 minutes but scores 14 points lower.`;
  }
  if (/incident|report|crime|theft/.test(q)) {
    const near = COMMUNITY_ALERTS.filter((a) => a.place.includes(L.city)).slice(0, 3);
    return near.length
      ? `There ${near.length === 1 ? "is" : "are"} ${near.length} recent community report${near.length === 1 ? "" : "s"} near ${L.city}: ${near.map((n) => `**${n.title}** (${n.minutesAgo} min ago, ${n.severity} severity)`).join("; ")}.`
      : `No open community reports near ${L.name} in the last 24 hours. Crime history is rated ${L.factors.crime.status.toLowerCase()}.`;
  }
  if (/weather|rain|fog/.test(q)) {
    return `Current conditions at ${L.name}: **${L.factors.weather.status}**. ${L.factors.weather.note} Flood risk is ${L.factors.flood.status.toLowerCase()} and air quality reads ${L.factors.air.status}.`;
  }
  if (/women|female|girl/.test(q)) {
    return `Women safety at ${L.name} is rated **${L.factors.women.status}** (${L.factors.women.value}/100). ${L.factors.women.note} Police presence is ${L.factors.police.status.toLowerCase()} and the average response time is ${L.responseMin} minutes.`;
  }
  if (/safe/.test(q)) {
    return aiSummary(L);
  }
  return `SafePath AI analysed ${L.name} across 15 safety factors and produced a score of **${L.score}/100**. ${aiSummary(L)} Ask me about the safest route, night safety, nearby hospitals or recent incidents.`;
}
