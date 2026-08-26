import { createFileRoute, Link, useNavigate , redirect} from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Badge,
  Bike,
  Bus,
  Car,
  Cloud,
  Compass,
  Cone,
  CornerUpRight,
  Flame,
  Footprints,
  Gauge,
  Heart,
  Lamp,
  Layers,
  LocateFixed,
  Mic,
  Moon,
  Navigation,
  Pause,
  Phone,
  Play,
  Route as RouteIcon,
  Search,
  Shield,
  Siren,
  Timer,
  Train,
  Users,
  Waves,
  Wind,
  Sparkle,
} from "lucide-react";
import { toast } from "sonner";

import { Shell } from "@/components/safepath/Shell";
import { SafetyRing } from "@/components/safepath/SafetyRing";
import { type MapLayers } from "@/components/safepath/MapCanvas";
import { GoogleRouteMap, type LiveRouteInfo, type TravelMode } from "@/components/safepath/GoogleMap";
import { OpenStreetMapRoute } from "@/components/safepath/OpenStreetMapRoute";
import { useApp, playBeep } from "@/lib/app-state";
import { useTrip } from "@/lib/trip-state";
import { useRouteWeather } from "@/lib/weather";
import { useOpenRoute } from "@/lib/openroute";
import { geocodeDestination } from "@/lib/destination";
import {
  aiSummary,
  bandColor,
  buildFactors,
  buildRoutes,
  findLocations,
  scoreBand,
  type FactorKey,
  type RouteOption,
} from "@/data/safepath";
import {
  DANGER_ANNOUNCEMENT,
  guidanceScript,
  parseVoiceCommand,
  speak,
  stopSpeaking,
  triggerSos,
  useSpeechRecognition,
  voiceLocale,
} from "@/lib/voice";
import {
  ListeningIndicator,
  RerouteDialog,
  VoiceFab,
  VoiceSheet,
  VoiceSubtitles,
} from "@/components/safepath/VoiceAssistant";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: "/login",
      });
    }
  },

  head: () => ({
    meta: [
      { title: "SafePath AI — Smarter Routes. Safer Journeys." },
      {
        name: "description",
        content:
          "AI-powered real-time travel safety assistant with live safety scores, explainable AI, safest route comparison, SOS and community alerts.",
      },
      {
        property: "og:title",
        content: "SafePath AI — Smarter Routes. Safer Journeys.",
      },
      {
        property: "og:description",
        content:
          "Search any destination and get an explainable AI safety score, safest routes, emergency services and live community alerts.",
      },
    ],
  }),

  component: HomePage,
});

const ICONS: Record<FactorKey, typeof Shield> = {
  crime: Shield,
  weather: Cloud,
  traffic: Car,
  crowd: Users,
  lighting: Lamp,
  road: RouteIcon,
  women: Heart,
  police: Badge,
  reports: Siren,
  transport: Bus,
  response: Timer,
  night: Moon,
  flood: Waves,
  construction: Cone,
  air: Wind,
};

// The built-in map keeps route planning usable while a Google Maps key is being
// configured. Set VITE_USE_GOOGLE_MAPS=true only after the Google Maps APIs and
// billing/referrer settings have been configured for this app.
type EmergencyContact = {
  name: string;
  phone: string;
};

function getEmergencyContacts(): EmergencyContact[] {
  try {
    const saved = localStorage.getItem(
      "safepath-emergency-contacts",
    );

    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
const TRANSPORTATION_DETAILS: Record<TravelMode, { label: string; reason: string }> = {
  DRIVING: { label: "Car", reason: "Best for the quickest door-to-door route and live traffic avoidance." },
  WALKING: { label: "Walk", reason: "Best for short trips where well-lit, lower-risk streets matter most." },
  BICYCLING: { label: "Bike", reason: "Balances travel time with flexible routing away from congested roads." },
  TRANSIT: { label: "Transit", reason: "Useful for longer trips with public-transport connections and reduced driving stress." },
};

function HomePage() {
  const { t, onboarded, setOnboarded, sound } = useApp();
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setSplash(false), 2600);
    return () => clearTimeout(id);
  }, []);

  if (splash) return <Splash tagline={t.tagline} />;
  if (!onboarded)
    return (
      <Onboarding
        onDone={() => {
          setOnboarded(true);
          playBeep(sound, 720);
        }}
      />
    );

  return (
    <Shell>
      <Home />
    </Shell>
  );
}

function Splash({ tagline }: { tagline: string }) {
  return (
    <div className="brand-gradient grid min-h-screen place-items-center px-8">
      <div className="text-center">
        <div className="relative mx-auto h-32 w-32">
          <span className="absolute inset-0 rounded-[2rem] bg-white/20 [animation:sp-pulse-ring_2s_ease-out_infinite]" />
          <div className="animate-floaty relative grid h-32 w-32 place-items-center rounded-[2rem] bg-white/15 backdrop-blur-xl">
            <Siren className="h-14 w-14 text-white" strokeWidth={2.2} />
          </div>
          <svg className="animate-orbit absolute -inset-4" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="white"
              strokeOpacity="0.5"
              strokeWidth="2"
              strokeDasharray="10 18"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="animate-rise mt-8 font-display text-4xl font-extrabold text-white">
          SafePath AI
        </h1>
        <p className="animate-rise mt-2 text-sm font-medium text-white/85">{tagline}</p>
        <div className="mx-auto mt-8 flex justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-white/80"
              style={{ animation: `sp-float 1s ${i * 0.12}s ease-in-out infinite` }}
            />
          ))}
        </div>
        <p className="mt-6 text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
          Initialising safety engine
        </p>
      </div>
    </div>
  );
}

const SLIDES = [
  {
    icon: Compass,
    title: "AI safety score for every destination",
    body: "15 live factors — crime, lighting, weather, crowd and more — fused into one clear score.",
  },
  {
    icon: RouteIcon,
    title: "Safest route, not just the fastest",
    body: "Compare routes side by side and see exactly why SafePath recommends one over another.",
  },
  {
    icon: Siren,
    title: "One-tap SOS and community alerts",
    body: "Share your location instantly, notify responders and stay ahead of incidents nearby.",
  },
];

function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const S = SLIDES[i];
  const Icon = S.icon;
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col justify-between bg-background px-6 py-10">
      <button onClick={onDone} className="press self-end text-sm font-semibold text-muted-foreground">
        Skip
      </button>
      <div key={i} className="animate-rise text-center">
        <div className="brand-gradient mx-auto grid h-28 w-28 place-items-center rounded-[2rem] shadow-float">
          <Icon className="h-12 w-12 text-white" strokeWidth={2} />
        </div>
        <h2 className="mt-8 font-display text-2xl font-bold">{S.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{S.body}</p>
      </div>
      <div>
        <div className="mb-6 flex justify-center gap-2">
          {SLIDES.map((_, n) => (
            <span
              key={n}
              className={`h-2 rounded-full transition-all ${n === i ? "w-7 bg-primary" : "w-2 bg-border"}`}
            />
          ))}
        </div>
        <button
          onClick={() => (i === SLIDES.length - 1 ? onDone() : setI(i + 1))}
          className="press brand-gradient w-full rounded-2xl py-4 font-display text-sm font-bold text-white shadow-float"
        >
          {i === SLIDES.length - 1 ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}

function Home() {
  const { t, lang, offline, recentSearches, pushSearch, sound, voiceNav, addTrip } = useApp();
  const [sosOpen, setSosOpen] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const { dest, setDestId, setDestination } = useTrip();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [layers, setLayers] = useState<MapLayers>({
    traffic: true,
    heatmap: true,
    weather: false,
    incidents: true,
    services: true,
  });
  const [activeRouteId, setActiveRouteId] = useState<RouteOption["id"]>("safest");
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");
  const [liveRoutes, setLiveRoutes] = useState<LiveRouteInfo[]>([]);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState<boolean | null>(null);
  const [googleRouteStatus, setGoogleRouteStatus] = useState("");
  const [locationRefresh, setLocationRefresh] = useState(0);
  const [why, setWhy] = useState<RouteOption | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const tripRecordedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  /* voice assistant state */
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [subtitleSpeaking, setSubtitleSpeaking] = useState(false);
  const [reroute, setReroute] = useState(false);
  const firedCues = useRef<Set<number>>(new Set());
  const dangerFired = useRef(false);
  const lastSpoken = useRef("");
  const subtitleTimer = useRef<number | null>(null);

  const suggestions = useMemo(() => findLocations(query).slice(0, 6), [query]);
  const routes = useMemo(() => (dest ? buildRoutes(dest) : []), [dest]);
  const activeRoute = routes.find((r) => r.id === activeRouteId) ?? routes[0] ?? null;
  const selectedRouteIndex = Math.max(0, routes.findIndex((r) => r.id === activeRouteId));
  const currentTravel = TRANSPORTATION_DETAILS[travelMode];
  const { route: orsRoute, loading: orsLoading, unavailable: orsUnavailable } = useOpenRoute(dest, travelMode);
  const liveSelectedRoute = liveRoutes[selectedRouteIndex];
  const displayedDuration = liveSelectedRoute?.durationInTraffic ?? liveSelectedRoute?.duration ?? (orsRoute?.duration ?? "Google route unavailable");
  const displayedDistance = liveSelectedRoute?.distance ?? (orsRoute?.distance ?? "Google route unavailable");
  const displayedDurationMinutes = parseDurationMinutes(displayedDuration);
  const displayedDistanceKm = parseDistanceKm(displayedDistance);
  const factors = useMemo(() => (dest ? buildFactors(dest) : []), [dest]);
  const { weather: liveWeather, loading: weatherLoading, unavailable: weatherUnavailable } = useRouteWeather(dest?.lat, dest?.lng);

  function showSubtitle(text: string, speaking: boolean) {
    setSubtitle(text);
    setSubtitleSpeaking(speaking);
    if (subtitleTimer.current) window.clearTimeout(subtitleTimer.current);
    subtitleTimer.current = window.setTimeout(() => setSubtitle(""), 5200);
  }

  function announce(text: string) {
    lastSpoken.current = text;
    showSubtitle(text, true);
    speak(text, { enabled: voiceNav, lang: voiceLocale(lang), interrupt: true });
  }

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    setEmergencyContacts(getEmergencyContacts());

    const handleStorage = () => setEmergencyContacts(getEmergencyContacts());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!playing || !activeRoute) return;
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = (p ?? 0) + 0.012;
        if (next >= 1) {
          window.clearInterval(timerRef.current!);
          setPlaying(false);
          tripRecordedRef.current = false;
          toast.success("Arrived safely at your destination");
          return 1;
        }
        return next;
      });
    }, 90);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [playing, activeRoute]);

  /* turn-by-turn voice guidance */
  useEffect(() => {
    if (progress == null || !activeRoute) return;
    const risky = activeRoute.score < 78;
    for (const cue of guidanceScript(risky)) {
      if (progress >= cue.at && !firedCues.current.has(cue.at)) {
        firedCues.current.add(cue.at);
        announce(cue.text);
        if (cue.tone === "warn") toast.warning(cue.text, { icon: "🔊" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, activeRoute]);

  /* AI danger interrupt while voice navigation is running */
  useEffect(() => {
    if (progress == null || !activeRoute || !playing) return;
    const safer = routes.find((r) => r.id !== activeRoute.id && r.score > activeRoute.score + 4);
    if (!safer || dangerFired.current) return;
    if (progress >= 0.42 && activeRoute.score < 88) {
      dangerFired.current = true;
      setPlaying(false);
      announce(DANGER_ANNOUNCEMENT);
      setReroute(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, playing, activeRoute, routes]);

  function select(id: string, name: string, thenNavigate = false) {
    setAnalysing(true);
    setQuery(name);
    setFocused(false);
    pushSearch(name);
    playBeep(sound, 740);
    setProgress(null);
    setPlaying(false);
    stopNavigation(false);
    window.setTimeout(() => {
      setDestId(id);
      setAnalysing(false);
      toast.success("AI safety analysis complete");
      const loc = findLocations(name)[0];
      if (loc) {
        const safest = buildRoutes(loc)[0];
        announce(
          `Safest route to ${loc.name} found. Distance ${safest.km} kilometres, estimated time ${safest.minutes} minutes, AI safety score ${safest.score} out of 100.`,
        );
        if (thenNavigate) {
          setActiveRouteId("safest");
          startNavigation("safest", false);
        }
      }
    }, 900);
  }

  async function searchAnyDestination() {
    const destination = query.trim();
    if (!destination) return;
    const known = findLocations(destination)[0];
    if (known) {
      select(known.id, known.name);
      return;
    }
    setAnalysing(true);
    setFocused(false);
    try {
      const geocoded = await geocodeDestination(destination);
      setDestination(geocoded);
      pushSearch(geocoded.name);
      toast.success("Destination found. Safety sources are being combined.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to search destination.");
    } finally {
      setAnalysing(false);
    }
  }

  function startNavigation(id: RouteOption["id"], say = true) {
    setActiveRouteId(id);
    firedCues.current = new Set();
    dangerFired.current = false;
    setProgress(0);
    setPlaying(true);
    recordCurrentTrip(travelMode);
    if (say) announce("Starting navigation on the selected route.");
  }

  function recordCurrentTrip(mode: TravelMode = travelMode) {
    if (!dest || !activeRoute || tripRecordedRef.current) return;
    const distanceText = liveSelectedRoute?.distance ?? orsRoute?.distance;
    const durationText = liveSelectedRoute?.durationInTraffic ?? liveSelectedRoute?.duration ?? orsRoute?.duration;
    const distanceKm = distanceText ? parseDistanceKm(distanceText) : activeRoute.km;
    const durationMin = durationText ? parseDurationMinutes(durationText) : activeRoute.minutes;
    addTrip({ destination: dest.name, score: dest.score, mode, distanceKm, durationMin });
    tripRecordedRef.current = true;
  }

  function openGoogleMaps(id: RouteOption["id"], mode: TravelMode = travelMode) {
    if (!dest) return;
    setActiveRouteId(id);
    recordCurrentTrip(mode);
    const googleMode = {
      DRIVING: "driving",
      WALKING: "walking",
      BICYCLING: "bicycling",
      TRANSIT: "transit",
    }[mode];
    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("destination", `${dest.lat},${dest.lng}`);
    url.searchParams.set("travelmode", googleMode);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
    toast.success("Opening Google Maps for directions from your current location.");
  }
    async function handleSOS() {
  setSosLoading(true);

  try {
    const contacts = getEmergencyContacts();
    const validContacts = contacts
      .map((contact) => ({
        name: contact.name.trim(),
        phone: contact.phone.replace(/\D/g, ""),
      }))
      .filter((contact) => contact.name && contact.phone);

    if (validContacts.length === 0) {
      toast.error(
        "No emergency contact found. Add a contact in Settings first.",
      );
      setSosLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser.");
      setSosLoading(false);
      return;
    }

    const phoneNumbers = validContacts.map((contact) => contact.phone);
    const medical = (() => {
      try {
        return JSON.parse(localStorage.getItem("safepath-medical-info") || "{}") as Record<string, string>;
      } catch { return {}; }
    })();
    let lastSentAt = 0;
    const composeSms = async (latitude: number, longitude: number, liveUpdate = false) => {
      const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const timestamp = new Date().toISOString();

      const message =
        `SAFEPATH AI SOS ALERT\n\n` +
        `I need emergency assistance.\n\n` +
        `My current location:\n${locationUrl}\n\n` +
        `Latitude: ${latitude.toFixed(6)}\n` +
        `Longitude: ${longitude.toFixed(6)}\n` +
        `Updated: ${timestamp}\n\n` +
        `Medical information:\n` +
        `Blood group: ${medical.bloodGroup || "Not provided"}\n` +
        `Allergies: ${medical.allergies || "Not provided"}\n` +
        `Conditions: ${medical.conditions || "Not provided"}\n` +
        `Insurance: ${medical.insurance || "Not provided"}\n\n` +
        `Please contact me immediately.`;

      try {
        const smsUrl = import.meta.env.VITE_SMS_API_URL || `http://${window.location.hostname}:3001/api/send-sms`;
        const response = await fetch(smsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: phoneNumbers,
            message,
          }),
        });

        const result = await response.json();

        lastSentAt = Date.now();
        setSosLoading(false);
        if (!liveUpdate) setSosOpen(false);
        if (!liveUpdate) localStorage.setItem("sp.sos-count", `${Number(localStorage.getItem("sp.sos-count") || 0) + 1}`);

        if (!response.ok || !result.ok) {
          throw new Error(result.error || "SMS send failed");
        }

        toast.success(liveUpdate ? "Live SOS location update sent." : `Emergency SMS sent to ${validContacts.length} saved contact${validContacts.length > 1 ? "s" : ""}.`);
      } catch (error) {
        setSosLoading(false);
        toast.error(
          error instanceof Error ? error.message : "Unable to send emergency SMS.",
        );
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        if (!lastSentAt || Date.now() - lastSentAt >= 60_000) void composeSms(latitude, longitude, lastSentAt > 0);
      },
      () => {
        setSosLoading(false);
        toast.error("Unable to get your current location. Please allow location access.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
    window.setTimeout(() => navigator.geolocation.clearWatch(watchId), 15 * 60_000);
  } catch {
    setSosLoading(false);

    toast.error(
      "Something went wrong while activating SOS.",
    );
  }
}
  function stopNavigation(say = true) {
    setPlaying(false);
    tripRecordedRef.current = false;
    firedCues.current = new Set();
    dangerFired.current = false;
    if (say) announce("Navigation stopped.");
  }

  function cancelRoute() {
    setPlaying(false);
    setProgress(null);
    firedCues.current = new Set();
    dangerFired.current = false;
    announce("Route cancelled.");
  }

  /* ---------------- voice command handling ---------------- */
  function handleCommand(text: string) {
    showSubtitle(text, false);
    const intent = parseVoiceCommand(text);

    setVoiceOpen(false);
    switch (intent.type) {
      case "destination":
        setQuery(intent.label);
        announce(`Finding the safest route to ${intent.label}.`);
        select(intent.locationId, intent.label, true);
        break;
      case "nearest":
        announce(`Showing the nearest ${intent.label} around you.`);
        navigate({ to: "/services" });
        break;
      case "home": {
        const home = findLocations("Chennai Central")[0] ?? findLocations("")[0];
        announce("Navigating home.");
        if (home) select(home.id, home.name, true);
        break;
      }
      case "report":
        announce("Opening incident reporting.");
        navigate({ to: "/report" });
        break;
      case "emergency":
        announce("Connecting you to emergency services.");
        toast.error("Calling emergency services · 112 (prototype demo)");
        break;
      case "sos":
        announce("Activating S O S.");
        setSosOpen(true);
        break;
      case "stop":
        stopNavigation();
        break;
      case "cancel":
        cancelRoute();
        break;
      case "repeat":
        if (lastSpoken.current) announce(lastSpoken.current);
        break;
      default:
        setQuery(text);
        announce("Sorry, I didn't catch that. I've put it in the search bar so you can edit it.");
    }
  }

  const recognition = useSpeechRecognition({
    lang: voiceLocale(lang),
    onFinal: handleCommand,
  });
  const { supported, listening, interim, transcript, error, start, stop } = recognition;

  useEffect(() => {
    if (interim) showSubtitle(interim, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interim]);

  async function toggleVoice(openSheet = false) {
    playBeep(sound, 700);
    if (listening) {
      stop();
      return;
    }
    if (openSheet) setVoiceOpen(true);
    if (!supported) {
      setVoiceOpen(true);
      toast("Speech recognition isn't available in this browser — type your command instead.", {
        icon: "⌨️",
      });
      return;
    }
    await start();
  }

  return (
  <div className="space-y-4">

    {dest && (
      <section className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">Live Google routes</p>
            <p className="mt-1 text-xs text-muted-foreground">Current traffic and travel time for {currentTravel.label.toLowerCase()}.</p>
          </div>
          <button
            onClick={() => {
              setUsingCurrentLocation(null);
              setLocationRefresh((value) => value + 1);
              toast("Requesting your current location…");
            }}
            className="press flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[0.65rem] font-bold text-primary-foreground"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            Use my location
          </button>
        </div>
        <GoogleRouteMap
          destination={dest}
          mode={travelMode}
          showTraffic={layers.traffic}
          selectedRouteIndex={selectedRouteIndex}
          onRoutesChange={setLiveRoutes}
          onLocationStatus={setUsingCurrentLocation}
          onRouteStatus={setGoogleRouteStatus}
          refreshLocation={locationRefresh}
          className="h-[300px]"
        />
      </section>
    )}

    {/* search */}
      {/* search */}
      <div className="relative z-20">
        <div className="glass flex items-center gap-2 rounded-2xl px-3 py-2.5 shadow-soft">
          <Search className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFocused(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void searchAnyDestination();
            }}
            onFocus={() => setFocused(true)}
            placeholder={t.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => void searchAnyDestination()}
            aria-label="Search destination"
            className="press grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground"
          >
            <Navigation className="h-4 w-4" />
          </button>
          <button
            onClick={() => void toggleVoice()}
            aria-label={t.voiceSearch}
            className={`press grid h-9 w-9 place-items-center rounded-xl ${
              listening ? "bg-destructive text-destructive-foreground" : "bg-primary/12 text-primary"
            }`}
          >
            {listening ? <ListeningIndicator compact /> : <Mic className="h-4 w-4" />}
          </button>
        </div>

        {listening && (
          <div className="animate-pop mt-2 flex items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-destructive">
            <ListeningIndicator />
            <p className="flex-1 text-xs font-semibold">
              {interim || transcript || "Listening… speak your destination or a command"}
            </p>
            <button onClick={stop} className="press text-[0.68rem] font-bold underline">
              Stop
            </button>
          </div>
        )}

        {!listening && error === "permission" && (
          <p className="mt-2 rounded-2xl bg-warn/12 px-4 py-2.5 text-xs font-medium text-warn">
            Microphone access was denied — you can still type your destination.
          </p>
        )}


        {focused && (
          <div className="absolute inset-x-0 top-full z-[2000] mt-2 overflow-hidden rounded-2xl border bg-card shadow-float">
            {recentSearches.length > 0 && !query && (
              <p className="px-4 pt-3 text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                Recent
              </p>
            )}
            {suggestions.map((s) => (
              <button
                key={s.id}
                onMouseDown={() => select(s.id, s.name)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[0.7rem] font-bold text-white"
                  style={{ background: bandColor(s.score) }}
                >
                  {s.score}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{s.name}</span>
                  <span className="block truncate text-[0.7rem] text-muted-foreground">
                    {s.city}, {s.state}
                  </span>
                </span>
              </button>
            ))}
            <button
              onMouseDown={() => setFocused(false)}
              className="w-full border-t px-4 py-2.5 text-xs font-semibold text-muted-foreground"
            >
              Close
            </button>
          </div>
        )}
      </div>

      <section className="rounded-2xl border bg-card p-3 shadow-soft">
        <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">Travel mode</p>
        <div className="grid grid-cols-4 gap-2">
          {([
            ["DRIVING", "Car", Car],
            ["WALKING", "Walk", Footprints],
            ["BICYCLING", "Bike", Bike],
            ["TRANSIT", "Transit", Train],
          ] as const).map(([mode, label, Icon]) => (
            <button
              key={mode}
              onClick={() => setTravelMode(mode)}
              className={`press flex flex-col items-center gap-1 rounded-xl py-2 text-[0.68rem] font-semibold ${travelMode === mode ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {orsLoading
            ? "Calculating the route from your current location…"
            : orsRoute
              ? `Google Directions calculated ${liveSelectedRoute?.durationInTraffic ?? liveSelectedRoute.duration} for ${currentTravel.label.toLowerCase()}.`
            : usingCurrentLocation === true
            ? "Live travel times are calculated from your current location."
            : usingCurrentLocation === false
              ? "Location access is off — enable it in your browser for travel times from your current location."
              : "Requesting your current location for live travel times…"}
        </p>
              {googleRouteStatus && <p className={`mt-2 text-[0.68rem] font-medium ${liveRoutes.length ? "text-safe" : "text-warn"}`}>{googleRouteStatus}</p>}
      </section>

      <section className="rounded-2xl border bg-card p-3 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">Selected journey</p>
            <p className="mt-1 text-sm font-bold">{currentTravel.label} · {displayedDuration}{orsRoute ? ` · ${orsRoute.distance}` : ""}</p>
          </div>
          {activeRoute && <span className="rounded-full bg-safe/15 px-3 py-1 text-xs font-bold text-safe">Safety {activeRoute.score}/100</span>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Why {currentTravel.label}? {currentTravel.reason}</p>
        {orsUnavailable && travelMode !== "TRANSIT" && <p className="mt-2 text-[0.68rem] font-medium text-warn">Unable to calculate this route. Allow browser location access and try again.</p>}
      </section>

      {/* layer chips */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {(
          [
            ["traffic", "Traffic"],
            ["heatmap", "Risk heatmap"],
            ["weather", "Weather"],
            ["incidents", "Incidents"],
            ["services", "Services"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
            className={`press flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.7rem] font-semibold ${
              layers[key] ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {offline && (
        <p className="rounded-2xl bg-warn/12 px-4 py-3 text-xs font-medium text-warn">
          Offline mode active — showing cached safety data from your last sync.
        </p>
      )}

      {dest && (
        <section className="rounded-3xl border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3"><div><p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">Route weather</p><p className="mt-1 text-sm font-bold">{weatherLoading ? "Loading current weather…" : liveWeather ? `${liveWeather.temperature}°C · ${liveWeather.condition}` : "Weather data unavailable"}</p></div>
            {liveWeather && <span className={`rounded-full px-3 py-1 text-xs font-bold ${liveWeather.risk === "High" ? "bg-danger/15 text-danger" : liveWeather.risk === "Moderate" ? "bg-warn/15 text-warn" : "bg-safe/15 text-safe"}`}>{liveWeather.risk} weather risk</span>}</div>
          {liveWeather ? <p className="mt-2 text-xs text-muted-foreground">Wind {liveWeather.windKph} km/h{liveWeather.visibilityKm != null ? ` · Visibility ${liveWeather.visibilityKm} km` : ""}. Weather is one input in the AI-assisted route assessment.</p> : weatherUnavailable ? <p className="mt-2 text-xs text-muted-foreground">Live weather data is currently unavailable. Other safety factors are still being evaluated.</p> : null}
        </section>
      )}

      {!dest && !analysing && <EmptyState onPick={select} />}

      {dest && !analysing && (
        <>
          {/* score card */}
          <section className="glass overflow-hidden rounded-3xl p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">
                  {t.safetyScore}
                </p>
                <h2 className="mt-1 truncate font-display text-lg font-bold">{dest.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {dest.city}, {dest.state}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-[0.68rem] font-bold text-white"
                style={{ background: bandColor(dest.score) }}
              >
                {scoreBand(dest.score) === "safe"
                  ? t.safe
                  : scoreBand(dest.score) === "moderate"
                    ? t.moderate
                    : t.highRisk}
              </span>
            </div>
            <div className="mt-3 grid place-items-center">
              <SafetyRing score={dest.score} animateKey={dest.id} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <Mini label="Crime index" value={`${dest.crimeIndex}`} />
              <Mini label="Response" value={`${dest.responseMin} min`} />
              <Mini label="Confidence" value="94%" />
            </div>
          </section>

          <section className="rounded-3xl border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">Safety sources</p>
                <p className="mt-1 text-sm font-bold">{dest.tags.includes("Geocoded destination") ? "Destination intelligence" : "Verified location profile"}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.62rem] font-bold text-primary">15 inputs</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[0.68rem]">
              <Source name="OpenStreetMap" status="Location" live />
              <Source name="Weather API" status={liveWeather ? "Live weather" : "Unavailable"} live={Boolean(liveWeather)} />
              <Source name="Route engine" status={orsRoute ? "Live route" : "Estimate"} live={Boolean(orsRoute)} />
              <Source name="Community alerts" status="Nearby reports" live={false} />
            </div>
            {dest.tags.includes("Geocoded destination") && (
              <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
                Some local inputs are estimates because this destination has no matching SafePath profile. Connect crime, air-quality, hazard and local incident feeds to replace estimates with verified data.
              </p>
            )}
          </section>

          {dest.facts && (
            <section className="rounded-3xl border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-widest text-muted-foreground">Place information</p>
                  <p className="mt-1 text-sm font-bold">{dest.facts.category}</p>
                </div>
                <a href={dest.facts.sourceUrl} target="_blank" rel="noreferrer" className="text-[0.65rem] font-bold text-primary">View source</a>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{dest.facts.description}</p>
              <p className="mt-2 text-[0.6rem] font-semibold text-muted-foreground">Source: {dest.facts.source}</p>
            </section>
          )}

          {/* AI summary */}
          <section className="rounded-3xl border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Sparkle className="h-4 w-4 text-accent" />
              <h3 className="font-display text-sm font-bold">{t.aiSummary}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{aiSummary(dest)}</p>
          </section>

          {/* explainable AI */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold">{t.explainable}</h3>
              <span className="text-[0.68rem] font-semibold text-muted-foreground">
                15 factors analysed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {factors.map((f, i) => {
                const Icon = ICONS[f.key];
                const col =
                  f.value >= 78
                    ? "var(--color-safe)"
                    : f.value >= 58
                      ? "var(--color-warn)"
                      : "var(--color-danger)";
                return (
                  <div
                    key={f.key}
                    className="animate-rise rounded-2xl border bg-card p-3 shadow-soft"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="grid h-7 w-7 place-items-center rounded-lg"
                        style={{ background: `color-mix(in oklab, ${col} 18%, transparent)` }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: col }} />
                      </span>
                      <p className="truncate text-[0.72rem] font-bold">{f.label}</p>
                    </div>
                    <p className="mt-2 text-[0.7rem] font-semibold" style={{ color: col }}>
                      {f.status}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${f.value}%`, background: col }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[0.6rem] font-semibold text-muted-foreground">
                      <span>−{f.impact} pts</span>
                      <span>{f.confidence}% conf.</span>
                    </div>
                    <p className="mt-1.5 text-[0.63rem] leading-snug text-muted-foreground">{f.note}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* routes */}
          <section className="space-y-3">
            <h3 className="font-display text-sm font-bold">{t.routeComparison}</h3>
            {routes.map((r) => (
              (() => {
                const live = liveRoutes[routes.indexOf(r)];
                const comparison = liveRoutes[0] && live && live !== liveRoutes[0]
                  ? `${Math.abs((parseDuration(live.durationInTraffic ?? live.duration) - parseDuration(liveRoutes[0].durationInTraffic ?? liveRoutes[0].duration)))} min vs safest`
                  : null;
                return (
              <div
                key={r.id}
                className={`rounded-3xl border bg-card p-4 shadow-soft transition-all ${
                  activeRouteId === r.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: r.color }}
                    />
                    <p className="font-display text-sm font-bold">{r.name}</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[0.68rem] font-bold text-white"
                    style={{ background: bandColor(r.score) }}
                  >
                    {r.score}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm font-semibold">
                  <span className="flex items-center gap-1">
                    <Timer className="h-4 w-4 text-muted-foreground" /> {live?.durationInTraffic ?? live?.duration ?? (orsRoute && routes.indexOf(r) === selectedRouteIndex ? orsRoute.duration : "Google route unavailable")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Navigation className="h-4 w-4 text-muted-foreground" /> {live?.distance ?? (orsRoute && routes.indexOf(r) === selectedRouteIndex ? orsRoute.distance : "Google route unavailable")}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Gauge className="h-4 w-4" /> ETA{" "}
                    {new Date(Date.now() + r.minutes * 60000).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {live && <p className="mt-2 text-[0.68rem] font-medium text-muted-foreground">Live route: {live.summary}{comparison ? ` · ${comparison}` : ""}</p>}
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.68rem]">
                  <Row k="Traffic" v={r.traffic} />
                  <Row k="Road" v={r.road} />
                  <Row k="Lighting" v={r.lighting} />
                  <Row k="Weather" v={r.weather} />
                  <Row k="Crowd" v={r.crowd} />
                  <Row k="Toll" v={r.toll} />
                  <Row k="Accidents" v={r.accidents} />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setActiveRouteId(r.id);
                      playBeep(sound, 620);
                    }}
                    className="press flex-1 rounded-xl bg-secondary py-2 text-[0.7rem] font-bold"
                  >
                    {t.viewRoute}
                  </button>
                  <button
                    onClick={() => openGoogleMaps(r.id)}
                    className="press flex-1 rounded-xl bg-primary py-2 text-[0.7rem] font-bold text-primary-foreground"
                  >
                    Open Google Maps
                  </button>
                  <button
                    onClick={() => setWhy(r)}
                    className="press rounded-xl bg-accent/15 px-3 py-2 text-[0.7rem] font-bold text-accent-foreground"
                  >
                    {t.whyRoute}
                  </button>
                </div>
              </div>
                );
              })()
            ))}
          </section>

          {/* playback */}
          {activeRoute && (
            <section className="rounded-3xl border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold">{t.playback}</h3>
                <button
                  onClick={() => {
                    if (playing) {
                      setPlaying(false);
                      return;
                    }
                    if (progress == null || progress >= 1) {
                      startNavigation(activeRoute.id, false);
                    } else {
                      setPlaying(true);
                    }
                  }}
                  className="press flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-[0.7rem] font-bold text-primary-foreground"
                >
                  {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  {playing ? "Pause" : "Simulate trip"}
                </button>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(progress ?? 0) * 100}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <Mini label="Speed" value={`${playing ? 38 + Math.round((progress ?? 0) * 22) : 0} km/h`} />
                <Mini
                  label="Remaining"
                  value={`${(displayedDistanceKm * (1 - (progress ?? 0))).toFixed(1)} km`}
                />
                <Mini
                  label="ETA"
                  value={`${Math.max(0, Math.round(displayedDurationMinutes * (1 - (progress ?? 0))))} min`}
                />
              </div>
              <p className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2 text-[0.68rem] font-medium">
                <CornerUpRight className="h-3.5 w-3.5 text-primary" />
                {(progress ?? 0) < 0.35
                  ? "Continue straight — road is well lit and patrolled"
                  : (progress ?? 0) < 0.7
                    ? "Keep right — avoiding a high-incident junction"
                    : "Approaching destination — crowd density rising"}
              </p>
            </section>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/services"
              className="press rounded-3xl border bg-card p-4 text-left shadow-soft"
            >
              <Flame className="h-5 w-5 text-danger" />
              <p className="mt-2 text-sm font-bold">{t.nearbyServices}</p>
              <p className="text-[0.68rem] text-muted-foreground">
                {dest.services.length} services nearby
              </p>
            </Link>
            <Link to="/report" className="press rounded-3xl border bg-card p-4 text-left shadow-soft">
              <Siren className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-bold">{t.reportIncident}</p>
              <p className="text-[0.68rem] text-muted-foreground">Help the community stay safe</p>
            </Link>
          </div>
        </>
      )}

      {why && (
        <div
          className="fixed inset-0 z-[60] flex items-end bg-black/60 backdrop-blur-sm"
          onClick={() => setWhy(null)}
        >
          <div
            className="animate-rise w-full rounded-t-3xl bg-card p-6 shadow-float"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <h3 className="font-display text-lg font-bold">{why.name} — Why this route?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Explainable AI reasoning · confidence 91%
            </p>
            <ul className="mt-4 space-y-2">
              {why.reasons.map((r) => (
                <li
                  key={r}
                  className="flex gap-2 rounded-2xl bg-secondary px-3 py-2.5 text-xs font-medium"
                >
                  <Shield className="h-4 w-4 shrink-0" style={{ color: why.color }} />
                  {r}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setWhy(null)}
              className="press mt-5 w-full rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              Got it
            </button>
          </div>
        </div>
      )}
      
      <VoiceFab listening={listening} onClick={() => void toggleVoice(true)} label={t.voiceSearch} />
      <VoiceSubtitles text={subtitle} speaking={subtitleSpeaking} />
      <VoiceSheet
        open={voiceOpen}
        listening={listening}
        supported={supported}
        interim={interim}
        transcript={transcript}
        error={error}
        onClose={() => {
          stop();
          setVoiceOpen(false);
        }}
        onRetry={() => void toggleVoice()}
        onSubmitText={handleCommand}
      />
      <RerouteDialog
        open={reroute}
        message={DANGER_ANNOUNCEMENT}
        onYes={() => {
          setReroute(false);
          const safer = [...routes].sort((a, b) => b.score - a.score)[0];
          if (safer) {
            setActiveRouteId(safer.id);
            firedCues.current = new Set();
            setProgress(0);
            setPlaying(true);
            announce(`Rerouting via the ${safer.name}. Estimated time ${safer.minutes} minutes.`);
            toast.success(`Switched to ${safer.name}`);
          }
        }}
        onNo={() => {
          setReroute(false);
          setPlaying(true);
          announce("Continuing on the current route. Stay alert.");
        }}
      />
    </div>
      

  );
}

function EmptyState({ onPick }: { onPick: (id: string, name: string) => void }) {
  const popular = findLocations("").slice(0, 4);
  return (
    <section className="rounded-3xl border bg-card p-5 text-center shadow-soft">
      <div className="brand-gradient mx-auto grid h-14 w-14 place-items-center rounded-2xl">
        <Compass className="h-7 w-7 text-white" />
      </div>
      <h3 className="mt-3 font-display text-base font-bold">Search a destination to begin</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        SafePath AI will analyse 15 safety factors and recommend the safest route.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {popular.map((p) => (
          <button
            key={p.id}
            onClick={() => onPick(p.id, p.name)}
            className="press rounded-full bg-secondary px-3 py-1.5 text-[0.7rem] font-semibold"
          >
            {p.name.split("(")[0].trim()}
          </button>
        ))}
      </div>
    </section>
  );
}

function parseDurationMinutes(value: string) {
  const hours = Number(value.match(/(\d+)\s*(?:hr|hour)/i)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)\s*(?:min|minute)/i)?.[1] ?? 0);
  return hours * 60 + minutes || Math.max(1, Number.parseInt(value, 10) || 1);
}

function parseDistanceKm(value: string) {
  const distance = Number.parseFloat(value.replace(",", ".")) || 0;
  return /m\b/i.test(value) && !/km/i.test(value) ? distance / 1000 : distance;
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary px-2 py-2.5">
      <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
    </div>
  );
}

function Source({ name, status, live }: { name: string; status: string; live: boolean }) {
  return (
    <div className="rounded-xl bg-secondary px-2.5 py-2">
      <p className="font-semibold">{name}</p>
      <p className={`mt-0.5 text-[0.6rem] ${live ? "text-safe" : "text-muted-foreground"}`}>{live ? "● " : "○ "}{status}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate text-right font-semibold">{v}</span>
    </p>
  );
}

function parseDuration(value: string): number {
  const hours = Number(value.match(/(\d+)\s*(?:hour|hr)/i)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)\s*(?:minute|min)/i)?.[1] ?? 0);
  return hours * 60 + minutes;
}
