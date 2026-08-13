import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/safepath/Shell";
import { useApp, playBeep } from "@/lib/app-state";
import { useTrip } from "@/lib/trip-state";
import { INCIDENT_CATEGORIES } from "@/data/safepath";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report an Incident — SafePath AI" },
      {
        name: "description",
        content:
          "Report accidents, theft, harassment, floods, roadblocks and hazards with photo, GPS and severity.",
      },
      { property: "og:title", content: "Report an Incident — SafePath AI" },
      {
        property: "og:description",
        content: "Community reports instantly appear as live alerts on the SafePath map.",
      },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { t, addReport, sound } = useApp();
  const { dest } = useTrip();
  const [category, setCategory] = useState<string>(INCIDENT_CATEGORIES[0]);
  const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const place = dest?.name ?? "Perundurai, Erode";

  return (
    <Shell>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          addReport({ category, severity, description, place, photo: photo ?? undefined });
          playBeep(sound, 820);
          toast.success("Report submitted — now live on community alerts");
          setDescription("");
          setPhoto(null);
        }}
        className="space-y-4"
      >
        <div>
          <h1 className="font-display text-xl font-bold">{t.reportIncident}</h1>
          <p className="text-xs text-muted-foreground">
            Your report helps thousands of travellers stay safe.
          </p>
        </div>

        <section className="rounded-3xl border bg-card p-4 shadow-soft">
          <h2 className="mb-3 font-display text-sm font-bold">Category</h2>
          <div className="flex flex-wrap gap-2">
            {INCIDENT_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`press rounded-full px-3 py-1.5 text-[0.7rem] font-semibold ${
                  category === c ? "bg-primary text-primary-foreground" : "bg-secondary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-soft">
          <h2 className="mb-3 font-display text-sm font-bold">Severity</h2>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["low", "Low", "var(--color-safe)"],
                ["medium", "Medium", "var(--color-warn)"],
                ["high", "High", "var(--color-danger)"],
              ] as const
            ).map(([v, label, col]) => (
              <button
                key={v}
                type="button"
                onClick={() => setSeverity(v)}
                className="press rounded-2xl py-2.5 text-[0.72rem] font-bold text-white transition-all"
                style={{ background: col, opacity: severity === v ? 1 : 0.35 }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-soft">
          <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-bold">
            <MapPin className="h-4 w-4 text-primary" /> Location
          </h2>
          <p className="rounded-2xl bg-secondary px-3 py-2.5 text-xs font-medium">
            {place} · GPS 11.2748° N, 77.6069° E (accuracy 4 m)
          </p>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-soft">
          <h2 className="mb-2 font-display text-sm font-bold">Description</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe what you saw…"
            className="w-full resize-none rounded-2xl bg-secondary p-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          <label className="press mt-3 flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed px-3 py-3 text-xs font-semibold text-muted-foreground">
            <Camera className="h-4 w-4" />
            {photo ? "Photo attached — tap to replace" : "Attach a photo (optional)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPhoto(URL.createObjectURL(f));
              }}
            />
          </label>
          {photo && (
            <img
              src={photo}
              alt="Incident evidence preview"
              className="mt-3 h-40 w-full rounded-2xl object-cover"
            />
          )}
        </section>

        <button
          type="submit"
          className="press brand-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-display text-sm font-bold text-white shadow-float"
        >
          <Send className="h-4 w-4" /> {t.submit}
        </button>
      </form>
    </Shell>
  );
}
