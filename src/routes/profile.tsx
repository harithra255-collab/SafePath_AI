import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  Award,
  Droplet,
  Heart,
  History,
  MapPinned,
  Phone,
  Settings2,
  Star,
  User,
} from "lucide-react";
import { Shell } from "@/components/safepath/Shell";
import { useApp } from "@/lib/app-state";
import { ACHIEVEMENTS, LOCATIONS } from "@/data/safepath";
import { supabase } from "@/lib/supabase";
export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Safety Profile — SafePath AI" },
      {
        name: "description",
        content:
          "Emergency contacts, medical details, favourite places, travel history, offline maps and safety achievements.",
      },
      { property: "og:title", content: "Your Safety Profile — SafePath AI" },
      {
        property: "og:description",
        content: "Everything responders need, ready in one tap.",
      },
    ],
  }),
  component: ProfilePage,
});

type EmergencyContact = {
  name: string;
  phone: string;
};

type MedicalInfo = {
  bloodGroup: string;
  allergies: string;
  conditions: string;
  insurance: string;
};

function getEmergencyContacts(): EmergencyContact[] {
  try {
    const saved = localStorage.getItem("safepath-emergency-contacts");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function getMedicalInfo(): MedicalInfo {
  try {
    const saved = localStorage.getItem("safepath-medical-info");
    return saved ? JSON.parse(saved) : {
      bloodGroup: "",
      allergies: "",
      conditions: "",
      insurance: "",
    };
  } catch {
    return {
      bloodGroup: "",
      allergies: "",
      conditions: "",
      insurance: "",
    };
  }
}

function getFavoritePlaces(): string[] {
  try { return JSON.parse(localStorage.getItem("sp.favorite-places") || "[]") as string[]; } catch { return []; }
}

function ProfilePage() {
  const { t, reports, trips } = useApp();

  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [medicalInfo, setMedicalInfo] = useState<MedicalInfo>({
    bloodGroup: "",
    allergies: "",
    conditions: "",
    insurance: "",
  });
  const [favoriteInput, setFavoriteInput] = useState("");
  const [favoritePlaces, setFavoritePlaces] = useState<string[]>([]);

  const favourites = LOCATIONS.slice(0, 3);
  const averageScore = trips.length ? Math.round(trips.reduce((total, trip) => total + trip.score, 0) / trips.length) : 0;
  const safePercent = trips.length ? Math.round((trips.filter((trip) => trip.score >= 78).length / trips.length) * 100) : 0;

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const name =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          "User";

        setUserName(name);
        setUserEmail(user.email ?? "");
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    setEmergencyContacts(getEmergencyContacts());
    setMedicalInfo(getMedicalInfo());
    setFavoritePlaces(getFavoritePlaces());

    const handleStorageChange = () => {
      setEmergencyContacts(getEmergencyContacts());
      setMedicalInfo(getMedicalInfo());
      setFavoritePlaces(getFavoritePlaces());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <Shell>
      <div className="space-y-4">
        <section className="glass rounded-3xl p-5 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="brand-gradient grid h-16 w-16 place-items-center rounded-3xl">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold">{userName}</h1>
              <p className="text-xs text-muted-foreground"> {userEmail}</p>
              <span className="mt-1 inline-block rounded-full bg-safe/15 px-2 py-0.5 text-[0.62rem] font-bold text-safe">
                Safety level: Guardian
              </span>
            </div>
            <Link to="/settings" className="press ml-auto grid h-10 w-10 place-items-center rounded-2xl bg-secondary">
              <Settings2 className="h-4.5 w-4.5" />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Stat label="Trips" value={`${trips.length}`} />
            <Stat label="Safe %" value={`${safePercent}%`} />
            <Stat label="Avg score" value={`${averageScore}`} />
          </div>
        </section>

        <Card title="Medical Information" icon={Droplet}>
          <Row k="Blood group" v={medicalInfo.bloodGroup || "Not added"} />
          <Row k="Allergies" v={medicalInfo.allergies || "Not added"} />
          <Row k="Conditions" v={medicalInfo.conditions || "Not added"} />
          <Row k="Insurance" v={medicalInfo.insurance || "Not added"} />
        </Card>

        <Card title="Emergency Contacts" icon={Phone}>
          {emergencyContacts.length > 0 ? (
            emergencyContacts.map((c) => (
              <div key={`${c.phone}-${c.name}`} className="flex items-center justify-between gap-3 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-[0.68rem] text-muted-foreground">{c.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${c.phone.replace(/\D/g, "")}`}
                    className="press grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary"
                    aria-label={`Call ${c.name}`}
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <span className="rounded-full bg-safe/15 px-2 py-0.5 text-[0.6rem] font-bold text-safe">
                    Auto-notify
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-2 text-sm text-muted-foreground">
              No emergency contacts saved yet. Add one in Settings.
            </div>
          )}
        </Card>

        <Card title="Favourite Places" icon={Star}>
          <div className="mb-2 flex gap-2">
            <input value={favoriteInput} onChange={(e) => setFavoriteInput(e.target.value)} placeholder="Add a favourite place" className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={() => { const place = favoriteInput.trim(); if (!place) return; const next = [...favoritePlaces, place]; setFavoritePlaces(next); localStorage.setItem("sp.favorite-places", JSON.stringify(next)); setFavoriteInput(""); }} className="press rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground">Add</button>
          </div>
          {[...favoritePlaces.map((name) => ({ id: name, name, score: 0 })), ...favourites].slice(0, 6).map((f) => (
            <Row key={f.id} k={f.name} v={f.score ? `Score ${f.score}` : "Saved place"} />
          ))}
        </Card>

        <Card title="Travel History" icon={History}>
          {trips.length > 0 ? trips.slice(0, 5).map((trip) => (
            <Row key={trip.id} k={trip.destination} v={`${trip.mode.toLowerCase()} · ${trip.distanceKm.toFixed(1)} km · ${trip.durationMin} min`} />
          )) : <Row k="No trips recorded" v="Start navigation to build history" />}
        </Card>

        <Card title="Offline Maps" icon={MapPinned}>
          <Row k="Erode district" v="Downloaded · 84 MB" />
          <Row k="Chennai metro area" v="Downloaded · 212 MB" />
          <Row k="Nilgiris" v="Queued" />
        </Card>

        <Card title="Achievements" icon={Award}>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.id} className="rounded-2xl bg-secondary p-3">
                <Heart className="h-4 w-4 text-accent" />
                <p className="mt-1 text-[0.72rem] font-bold">{a.label}</p>
                <p className="text-[0.62rem] text-muted-foreground">{a.id === "guardian" ? `${reports.length} reports submitted` : a.id === "night" ? `${trips.filter((trip) => trip.mode === "DRIVING").length} trips recorded` : a.id === "streak" ? `${trips.filter((trip) => trip.score >= 78).length} safe trips` : `${typeof window === "undefined" ? 0 : Number(localStorage.getItem("sp.sos-count") || 0)} SOS activations`}</p>
              </div>
            ))}
          </div>
        </Card>
        <p className="pb-2 text-center text-[0.62rem] text-muted-foreground">{t.tagline}</p>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary px-2 py-2.5">
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-[0.6rem] font-semibold uppercase text-muted-foreground">{label}</p>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Star;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-card p-4 shadow-soft">
      <h2 className="flex items-center gap-2 font-display text-sm font-bold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>
      <div className="mt-2 divide-y">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-xs">
      <span className="min-w-0 truncate text-muted-foreground">{k}</span>
      <span className="shrink-0 font-semibold">{v}</span>
    </div>
  );
}
