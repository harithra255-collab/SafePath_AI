import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Accessibility,
  Bell,
  Globe,
  Info,
  MapPinned,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  SunMoon,
  Trash2,
  Type,
  Volume2,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { Shell } from "@/components/safepath/Shell";
import { useApp } from "@/lib/app-state";
import { LANGUAGES } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SafePath AI" },
      {
        name: "description",
        content:
          "Theme, language, voice navigation, offline maps, privacy, accessibility and emergency contact preferences.",
      },
      { property: "og:title", content: "Settings — SafePath AI" },
      {
        property: "og:description",
        content:
          "Personalise SafePath AI across 6 languages, light and dark themes and offline mode.",
      },
    ],
  }),
  component: SettingsPage,
});

type EmergencyContact = {
  name: string;
  phone: string;
};

function SettingsPage() {
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >(() => {
    try {
      const saved = localStorage.getItem("safepath-emergency-contacts");

      if (!saved) return [];

      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const {
    t,
    theme,
    setTheme,
    lang,
    setLang,
    offline,
    setOffline,
    fontScale,
    setFontScale,
    voiceNav,
    setVoiceNav,
    sound,
    setSound,
  } = useApp();

  function addEmergencyContact() {
    const name = contactName.trim();
    const phone = contactPhone.trim();

    if (!name) {
      toast.error("Please enter the contact name.");
      return;
    }

    if (!phone) {
      toast.error("Please enter the phone number.");
      return;
    }

    const updatedContacts = [
      ...emergencyContacts,
      {
        name,
        phone,
      },
    ];

    setEmergencyContacts(updatedContacts);

    localStorage.setItem(
      "safepath-emergency-contacts",
      JSON.stringify(updatedContacts),
    );

    setContactName("");
    setContactPhone("");

    toast.success(`${name} added as an emergency contact.`);
  }

  function deleteEmergencyContact(index: number) {
    const updatedContacts = emergencyContacts.filter(
      (_, i) => i !== index,
    );

    setEmergencyContacts(updatedContacts);

    localStorage.setItem(
      "safepath-emergency-contacts",
      JSON.stringify(updatedContacts),
    );

    toast.success("Emergency contact removed.");
  }

  return (
    <Shell>
      <div className="space-y-4">

        <h1 className="font-display text-xl font-bold">
          {t.settings}
        </h1>

        {/* APPEARANCE */}
        <Section title="Appearance" icon={SunMoon}>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["light", t.lightMode, Sun],
                ["dark", t.darkMode, Moon],
                ["auto", t.autoTheme, SunMoon],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                onClick={() => setTheme(v)}
                className={`press flex flex-col items-center gap-1.5 rounded-2xl py-3 text-[0.68rem] font-bold ${
                  theme === v
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* LANGUAGE */}
        <Section title={t.language} icon={Globe}>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  toast.success(`${l.label} applied instantly`);
                }}
                className={`press rounded-2xl px-3 py-2.5 text-left text-xs font-semibold ${
                  lang === l.code
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                <span className="block">{l.native}</span>
                <span className="block text-[0.62rem] opacity-70">
                  {l.label}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {/* ACCESSIBILITY */}
        <Section title="Accessibility" icon={Accessibility}>
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Type className="h-4 w-4 text-muted-foreground" />
              Font size
            </span>

            <div className="flex gap-1">
              {(["sm", "md", "lg"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFontScale(f)}
                  className={`press h-8 w-9 rounded-lg text-[0.7rem] font-bold ${
                    fontScale === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* NAVIGATION */}
        <Section title="Navigation & Alerts" icon={Bell}>
          <Toggle
            icon={Volume2}
            label="Voice navigation"
            desc="Spoken turn-by-turn safety guidance"
            checked={voiceNav}
            onChange={setVoiceNav}
          />

          <Toggle
            icon={Bell}
            label="Sound effects"
            desc="Micro-interaction and alert tones"
            checked={sound}
            onChange={setSound}
          />

          <Toggle
            icon={WifiOff}
            label={t.offline}
            desc="Use cached maps, routes and safety data"
            checked={offline}
            onChange={(v) => {
              setOffline(v);
              toast(
                v
                  ? "Offline mode enabled — using cached data"
                  : "Back online",
              );
            }}
          />
        </Section>

        {/* OFFLINE MAPS */}
        <Section title="Offline Maps" icon={MapPinned}>
          {[
            "Erode district · 84 MB",
            "Chennai metro · 212 MB",
            "Nilgiris · 66 MB",
          ].map((m) => (
            <div
              key={m}
              className="flex items-center justify-between py-2 text-xs"
            >
              <span className="text-muted-foreground">{m}</span>

              <button
                onClick={() =>
                  toast.success("Map refreshed from cache")
                }
                className="press rounded-full bg-secondary px-3 py-1 text-[0.65rem] font-bold"
              >
                Update
              </button>
            </div>
          ))}
        </Section>

        {/* PRIVACY */}
        <Section title="Privacy & Permissions" icon={ShieldCheck}>
          <Toggle
            icon={ShieldCheck}
            label="Share live location with contacts"
            desc="Only during active SOS"
            checked={true}
            onChange={() =>
              toast("Location sharing is available during SOS")
            }
          />

          <Toggle
            icon={MapPinned}
            label="Precise location"
            desc="GPS + network location"
            checked={true}
            onChange={() =>
              toast("Manage location permission in device settings")
            }
          />

          <Toggle
            icon={Bell}
            label="Anonymous incident reporting"
            desc="Hide your name on community alerts"
            checked={false}
            onChange={() =>
              toast("Preference saved")
            }
          />
        </Section>

        {/* ================================================= */}
        {/* EMERGENCY CONTACTS */}
        {/* ================================================= */}

        <Section title="Emergency Contacts" icon={Phone}>

          <div className="space-y-4">

            {/* INFORMATION */}
            <div className="rounded-2xl bg-primary/10 p-3">
              <p className="text-xs font-semibold text-primary">
                Add trusted contacts for SOS
              </p>

              <p className="mt-1 text-[0.68rem] text-muted-foreground">
                During an SOS, SafePath can prepare an emergency
                message containing your current location.
              </p>
            </div>

            {/* CONTACT NAME */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                Contact name
              </label>

              <input
                type="text"
                value={contactName}
                onChange={(e) =>
                  setContactName(e.target.value)
                }
                placeholder="Example: Mother"
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* CONTACT PHONE */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold">
                Phone number
              </label>

              <input
                type="tel"
                value={contactPhone}
                onChange={(e) =>
                  setContactPhone(e.target.value)
                }
                placeholder="+91 9876543210"
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />

              <p className="mt-1 text-[0.62rem] text-muted-foreground">
                Include the country code, for example +91.
              </p>
            </div>

            {/* ADD CONTACT */}
            <button
              onClick={addEmergencyContact}
              className="press w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
            >
              + Add Emergency Contact
            </button>

            {/* SAVED CONTACTS */}
            {emergencyContacts.length > 0 && (
              <div className="space-y-2 pt-2">

                <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground">
                  Saved contacts
                </p>

                {emergencyContacts.map((contact, index) => (
                  <div
                    key={`${contact.phone}-${index}`}
                    className="flex items-center gap-3 rounded-2xl bg-secondary p-3"
                  >

                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {contact.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {contact.phone}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        deleteEmergencyContact(index)
                      }
                      className="press grid h-9 w-9 place-items-center rounded-xl bg-destructive/10 text-destructive"
                      aria-label={`Delete ${contact.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>
                ))}
              </div>
            )}

            {/* EMPTY STATE */}
            {emergencyContacts.length === 0 && (
              <div className="rounded-2xl border border-dashed p-4 text-center">
                <Phone className="mx-auto h-5 w-5 text-muted-foreground" />

                <p className="mt-2 text-xs font-semibold">
                  No emergency contacts
                </p>

                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  Add at least one trusted person for SOS.
                </p>
              </div>
            )}

          </div>

        </Section>

        {/* ABOUT */}
        <Section title="About" icon={Info}>
          <p className="text-xs text-muted-foreground">
            SafePath AI v1.4.0 (prototype build) · Safety engine
            2026.07 · Emergency actions are currently being
            integrated.
          </p>
        </Section>

      </div>
    </Shell>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Bell;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-card p-4 shadow-soft">
      <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h2>

      {children}
    </section>
  );
}

function Toggle({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-2">

      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {label}
        </p>

        <p className="text-[0.66rem] text-muted-foreground">
          {desc}
        </p>
      </div>

      <Switch
        checked={checked}
        onCheckedChange={onChange}
      />

    </div>
  );
}