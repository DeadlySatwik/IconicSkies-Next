import Image from "next/image";
import { CloudSun, MapPin } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatTemperature } from "@/lib/utils";
import { groupMomentsByMonth } from "@/lib/sky/monthly-recap";

type Moment = {
  id: string;
  note: string | null;
  title?: string | null;
  moodTags?: string[] | null;
  capturedAt: Date;
  favoriteLabel?: string | null;
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

function renderMomentCard(moment: Moment) {
  const hasPhoto = Boolean(moment.photoId);
  const moodTags = Array.isArray(moment.moodTags)
    ? moment.moodTags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0).slice(0, 5)
    : [];
  const photoSrc = moment.isMockPhoto && moment.photoUrl
    ? moment.photoUrl
    : hasPhoto
      ? `/api/photos/${moment.photoId}`
      : null;

  return (
    <article
      className={
        hasPhoto
          ? "grid gap-4 rounded-2xl border border-white/14 bg-[#09171c]/88 p-4 text-cloud shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl md:grid-cols-[minmax(180px,240px)_1fr]"
          : "rounded-2xl border border-white/14 bg-[#09171c]/88 p-4 text-cloud shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl"
      }
      key={moment.id}
    >
      {photoSrc ? (
        <div className="relative aspect-[4/3] min-h-40 overflow-hidden rounded-xl bg-[#071417] md:aspect-auto md:h-full">
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
          <div className="flex flex-wrap items-center gap-3 text-sm text-cloud/76">
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
            {moment.favoriteLabel ? (
              <span className="rounded-full border border-aurora/20 bg-aurora/14 px-2 py-1 text-xs font-semibold text-cloud">
                {moment.favoriteLabel}
              </span>
            ) : null}
            {hasPhoto ? (
              <span className="rounded-full border border-white/12 bg-white/8 px-2 py-1 text-xs font-semibold text-cloud/90">
                {moment.isMockPhoto ? "Mock photo" : "Uploaded photo"}
              </span>
            ) : null}
          </div>
          {moment.title ? (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-aurora">
              {moment.title}
            </p>
          ) : null}
          <h2 className={moment.title ? "mt-2 text-2xl font-semibold text-cloud" : "mt-3 text-2xl font-semibold text-cloud"}>
            {moment.condition} at{" "}
            {formatTemperature(moment.temperature, moment.units === "imperial" ? "imperial" : "metric")}
          </h2>
          <p className="mt-1 text-sm text-cloud/74">
            {moment.description ?? moment.comfortLabel ?? "Weather snapshot saved."}
          </p>
          {moodTags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {moodTags.map((tag) => (
                <span
                  className="rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-xs font-semibold text-cloud/88"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {moment.note ? (
            <p className="mt-4 max-w-2xl text-lg leading-8 text-cloud">{moment.note}</p>
          ) : (
            <p className="mt-4 text-cloud/62">No note yet.</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function SkyTimeline({ moments }: { moments: Moment[] }) {
  if (moments.length === 0) {
    return (
      <section className="rounded-2xl border border-white/14 bg-[#09171c]/88 p-8 text-center text-cloud shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <CloudSun aria-hidden className="mx-auto size-12 text-aurora" />
        <h2 className="mt-4 text-2xl font-semibold text-cloud">Your Sky Journal is waiting</h2>
        <p className="mx-auto mt-2 max-w-xl text-cloud/78">
          Search a city, save the weather, and write the first note in your timeline.
        </p>
      </section>
    );
  }

  const groupedMoments = groupMomentsByMonth(moments);

  return (
    <section className="space-y-5" aria-label="Sky Journal timeline">
      {groupedMoments.map((group, index) => (
        <CollapsibleSection
          key={group.monthKey}
          className="text-cloud"
          contentClassName="space-y-5 p-4 pt-0 sm:p-5 sm:pt-0"
          defaultOpen={index === 0}
          subtitle={index === 0 ? "Current month opens first so the newest skies are easy to scan." : "Older months stay tucked away until you need them."}
          summary={`${group.momentCount} moment${group.momentCount === 1 ? "" : "s"}`}
          title={group.monthLabel}
          variant="dark"
        >
          <div className="space-y-5">{group.moments.map((moment) => renderMomentCard(moment))}</div>
        </CollapsibleSection>
      ))}
    </section>
  );
}
