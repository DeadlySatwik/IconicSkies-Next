import Image from "next/image";
import { CloudSun, MapPin } from "lucide-react";
import { formatTemperature } from "@/lib/utils";

type Moment = {
  id: string;
  note: string | null;
  capturedAt: Date;
  photoId: string | null;
  cityName: string;
  country: string | null;
  temperature: number;
  units: string;
  condition: string;
  description: string | null;
  iconCode: string | null;
  comfortLabel: string | null;
  photoUrl: string | null;
  photoContentType: string | null;
  isMockPhoto: boolean | null;
};

export function SkyTimeline({ moments }: { moments: Moment[] }) {
  if (moments.length === 0) {
    return (
      <section className="rounded-xl border border-skyInk/10 bg-cloud p-8 text-center shadow-soft">
        <CloudSun aria-hidden className="mx-auto size-12 text-rain" />
        <h2 className="mt-4 text-2xl font-semibold">Your Sky Journal is waiting</h2>
        <p className="mx-auto mt-2 max-w-xl text-skyInk/70">
          Search a city, save the weather, and write the first note in your timeline.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5" aria-label="Sky Journal timeline">
      {moments.map((moment) => {
        const hasPhoto = Boolean(moment.photoId);
        const photoSrc = moment.isMockPhoto && moment.photoUrl
          ? moment.photoUrl
          : hasPhoto
            ? `/api/photos/${moment.photoId}`
            : null;

        return (
          <article
            className={
              hasPhoto
                ? "grid gap-4 rounded-xl border border-skyInk/10 bg-cloud p-4 shadow-soft md:grid-cols-[minmax(180px,240px)_1fr]"
                : "rounded-xl border border-skyInk/10 bg-cloud p-4 shadow-soft"
            }
            key={moment.id}
          >
            {photoSrc ? (
              <div className="relative aspect-[4/3] min-h-40 overflow-hidden rounded-lg bg-mist md:aspect-auto md:h-full">
                <Image
                  src={photoSrc}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 240px, 100vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}
            <div className="flex flex-col justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-skyInk/65">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin aria-hidden className="size-4" />
                  {moment.cityName}
                  {moment.country ? `, ${moment.country}` : ""}
                </span>
                <span>
                  {new Intl.DateTimeFormat("en", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(moment.capturedAt)}
                </span>
                {hasPhoto ? (
                  <span className="rounded-full bg-horizon/25 px-2 py-1 text-xs font-semibold text-skyInk">
                    {moment.isMockPhoto ? "Mock photo" : "Uploaded photo"}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-skyInk">
                {moment.condition} at {formatTemperature(moment.temperature, moment.units === "imperial" ? "imperial" : "metric")}
              </h2>
              <p className="mt-1 text-sm text-skyInk/65">
                {moment.description ?? moment.comfortLabel ?? "Weather snapshot saved."}
              </p>
              {moment.note ? (
                <p className="mt-4 max-w-2xl text-lg leading-8 text-skyInk">{moment.note}</p>
              ) : (
                <p className="mt-4 text-skyInk/55">No note yet.</p>
              )}
            </div>
          </div>
        </article>
        );
      })}
    </section>
  );
}
