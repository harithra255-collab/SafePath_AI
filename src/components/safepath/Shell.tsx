import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Home,
  MessageCircleMore,
  ShieldAlert,
  Siren,
  User,
  LogOut,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useApp, playBeep } from "@/lib/app-state";
import { SOS_EVENT } from "@/lib/voice";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

type EmergencyContact = {
  name: string;
  phone: string;
};

function getEmergencyContacts(): EmergencyContact[] {
  try {
    const saved = localStorage.getItem("safepath-emergency-contacts");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function sendSosMessage() {
  const contacts = getEmergencyContacts();
  const phoneNumbers = contacts
    .map((contact) => contact.phone.replace(/\D/g, ""))
    .filter(Boolean);

  if (phoneNumbers.length === 0) {
    toast.error("Add an emergency contact in Settings before using SOS.");
    return;
  }

  const openSmsComposer = (latitude?: number, longitude?: number) => {
    const location =
      latitude !== undefined && longitude !== undefined
        ? `https://www.google.com/maps?q=${latitude},${longitude}`
        : "Location unavailable";
    const message =
      "SAFEPATH AI SOS ALERT\n\nI need emergency assistance.\n\n" +
      `My current location: ${location}\n\nPlease contact me immediately.`;

    window.location.href =
      `sms:${phoneNumbers.join(",")}?body=${encodeURIComponent(message)}`;
    toast.success("SOS message ready in your SMS app.");
  };

  if (!navigator.geolocation) {
    openSmsComposer();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) =>
      openSmsComposer(position.coords.latitude, position.coords.longitude),
    () => {
      toast.error("Location unavailable. Opening SOS message without it.");
      openSmsComposer();
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  );
}


export function Shell({ children }: { children: ReactNode }) {
  const { t, offline } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const nav = [
    { to: "/", icon: Home, label: t.home },
    { to: "/alerts", icon: ShieldAlert, label: t.alerts },
    { to: "/chat", icon: MessageCircleMore, label: t.assistant },
    { to: "/analytics", icon: Activity, label: t.analytics },
    { to: "/profile", icon: User, label: t.profile },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col bg-background">
      <header className="sticky top-0 z-30 glass px-4 pb-3 pt-4">
        <div className="flex items-center gap-3">
          <div className="brand-gradient grid h-10 w-10 place-items-center rounded-2xl shadow-soft">
            <Siren className="h-5 w-5 text-white" strokeWidth={2.4} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold leading-tight">SafePath AI</p>
            <p className="truncate text-[0.68rem] text-muted-foreground">{t.tagline}</p>
          </div>
          {offline && (
            <span className="flex items-center gap-1 rounded-full bg-warn/15 px-2.5 py-1 text-[0.65rem] font-semibold text-warn">
              <WifiOff className="h-3 w-3" /> {t.offline}
            </span>
          )}
          <Link
            to="/notifications"
            className="press relative grid h-10 w-10 place-items-center rounded-2xl bg-secondary"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
          </Link>
          <button
            onClick={() => void signOut().then(() => navigate({ to: "/login" }))}
            aria-label="Log out"
            className="press grid h-10 w-10 place-items-center rounded-2xl bg-secondary text-muted-foreground"
          ><LogOut className="h-4 w-4" /></button>
        </div>
      </header>

      <main key={pathname} className="animate-rise flex-1 px-4 pb-40 pt-3">{children}</main>

      <SosButton />

      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[460px] -translate-x-1/2 glass px-2 pb-3 pt-2">
        <div className="flex items-end justify-between">
          {nav.map((n, i) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`press flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[0.62rem] font-semibold ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-2xl transition-all ${
                    active ? "bg-primary/12 scale-105" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function SosButton() {
  const { sound } = useApp();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [steps, setSteps] = useState<string[]>([]);
  const statusTimers = useRef<number[]>([]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(SOS_EVENT, handler);
    return () => window.removeEventListener(SOS_EVENT, handler);
  }, []);



  useEffect(() => {
    if (!open) return;
    setCount(5);
    setSteps([]);
    statusTimers.current.forEach((timer) => window.clearTimeout(timer));
    statusTimers.current = [];
    const contacts = getEmergencyContacts().filter((contact) => contact.phone.trim());
    const contactLabel = `${contacts.length} emergency contact${contacts.length === 1 ? "" : "s"}`;
    const timeline = [
      `Current location shared with ${contactLabel}`,
      `SOS message prepared for ${contactLabel}`,
      "Loud siren activated on device",
      "Medical information included in the SOS message",
    ];
    const tick = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(tick);
          sendSosMessage();
          timeline.forEach((s, i) => {
            const timer = window.setTimeout(() => {
              setSteps((prev) => [...prev, s]);
              playBeep(sound, 880 - i * 60, 80);
            }, i * 700);
            statusTimers.current.push(timer);
          });
          return 0;
        }
        playBeep(sound, 520, 70);
        return c - 1;
      });
    }, 1000);
    return () => {
      clearInterval(tick);
      statusTimers.current.forEach((timer) => window.clearTimeout(timer));
      statusTimers.current = [];
    };
  }, [open, sound]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="SOS Emergency"
        className="press fixed bottom-[96px] left-1/2 z-50 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-float"
      >
        <span className="absolute inset-0 rounded-full bg-destructive/60 [animation:sp-pulse-ring_2s_ease-out_infinite]" />
        <span className="relative font-display text-sm font-extrabold tracking-wider">SOS</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-float">
            {count > 0 ? (
              <>
                <div className="relative mx-auto grid h-28 w-28 place-items-center">
                  <span className="absolute inset-0 rounded-full bg-destructive/25 [animation:sp-pulse-ring_1.2s_ease-out_infinite]" />
                  <span className="grid h-24 w-24 place-items-center rounded-full bg-destructive font-display text-4xl font-bold text-destructive-foreground">
                    {count}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold">Sending SOS…</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Emergency alert will be broadcast when the countdown ends.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="press mt-5 w-full rounded-2xl bg-secondary py-3 text-sm font-semibold"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-destructive/15">
                  <Siren className="h-9 w-9 animate-pulse text-destructive" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-destructive">SOS Activated</h3>
                <ul className="mt-4 space-y-2 text-left">
                  {steps.map((s) => (
                    <li
                      key={`${s}-${steps.indexOf(s)}`}
                      className="animate-rise flex items-start gap-2 rounded-2xl bg-safe/10 px-3 py-2 text-xs font-medium text-foreground"
                    >
                      <span className="text-safe">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[0.65rem] text-muted-foreground">
                  Your SMS app was opened with the SOS message prefilled. Send it to notify your contacts.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="press mt-4 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
                >
                  I'm safe now
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
