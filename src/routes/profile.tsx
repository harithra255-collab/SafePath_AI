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

const CONTACTS = [
  { name: "Aarthi (Mother)", phone: "+91 8807328390" },
  { name: "Vikram (Brother)", phone: "+91 9944179977" },
  { name: "Hostel Warden", phone: "+91 90000 11223" },
];

function ProfilePage() {
  const { t, reports } = useApp();

  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");

  const favourites = LOCATIONS.slice(0, 3);
  const history = LOCATIONS.slice(3, 7);

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
            <Stat label="Trips" value="144" />
            <Stat label="Safe %" value="87%" />
            <Stat label="Reports" value={`${12 + reports.length}`} />
          </div>
        </section>

        <Card title="Medical Information" icon={Droplet}>
          <Row k="Blood group" v="O+" />
          <Row k="Allergies" v="Penicillin, dust" />
          <Row k="Conditions" v="Mild asthma — inhaler in bag" />
          <Row k="Insurance" v="Star Health · SH-88231907" />
        </Card>

        <Card title="Emergency Contacts" icon={Phone}>
          {CONTACTS.map((c) => (
            <div key={c.phone} className="flex items-center justify-between py-1.5">
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-[0.68rem] text-muted-foreground">{c.phone}</p>
              </div>
              <span className="rounded-full bg-safe/15 px-2 py-0.5 text-[0.6rem] font-bold text-safe">
                Auto-notify
              </span>
            </div>
          ))}
        </Card>

        <Card title="Favourite Places" icon={Star}>
          {favourites.map((f) => (
            <Row key={f.id} k={f.name} v={`Score ${f.score}`} />
          ))}
        </Card>

        <Card title="Travel History" icon={History}>
          {history.map((h, i) => (
            <Row key={h.id} k={h.name} v={`${i + 1} day${i ? "s" : ""} ago`} />
          ))}
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
                <p className="text-[0.62rem] text-muted-foreground">{a.detail}</p>
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
