import Image from "next/image";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getCurrentUser().catch(() => null);

  return (
    <header className="sticky top-0 z-30 border-b border-skyInk/10 bg-cloud/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-skyInk">
          <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-cloud ring-1 ring-skyInk/10">
            <Image
              src="/assets/icon.png"
              alt=""
              width={40}
              height={40}
              className="size-10"
              priority
            />
          </span>
          <span>IconicSkies</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium">
          <Link className="rounded-md px-3 py-2 hover:bg-skyInk/10 focus:outline-none focus:ring-2 focus:ring-rain" href="/">
            Weather
          </Link>
          {user ? (
            <>
              <Link
                className="rounded-md px-3 py-2 hover:bg-skyInk/10 focus:outline-none focus:ring-2 focus:ring-rain"
                href="/dashboard"
              >
                Journal
              </Link>
              <form action="/api/auth/logout" method="post">
                <button
                  className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-skyInk/10 focus:outline-none focus:ring-2 focus:ring-rain"
                  type="submit"
                >
                  <LogOut aria-hidden className="size-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                className="rounded-md px-3 py-2 hover:bg-skyInk/10 focus:outline-none focus:ring-2 focus:ring-rain"
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-md bg-skyInk px-3 py-2 text-cloud hover:bg-night focus:outline-none focus:ring-2 focus:ring-rain"
                href="/register"
              >
                <UserRound aria-hidden className="size-4" />
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
