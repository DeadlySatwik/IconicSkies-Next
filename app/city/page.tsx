import { redirect } from "next/navigation";
import { slugifyCity } from "@/lib/utils";

export default async function CityRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; units?: string }>;
}) {
  const query = await searchParams;
  const city = query.city?.trim();
  if (!city) redirect("/");

  const units = query.units === "imperial" ? "imperial" : "metric";
  redirect(`/city/${slugifyCity(city)}?units=${units}`);
}
