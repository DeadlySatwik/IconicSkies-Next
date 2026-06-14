import Image from "next/image";
import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getCurrentUser().catch(() => null);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071417] text-cloud shadow-[0_1px_24px_rgba(0,0,0,0.20)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-cloud ring-1 ring-white/20">
            <Image
              src="/assets/icon.png"
              alt=""
              width={40}
              height={40}
              className="size-10"
              priority
            />
          </span>
          <span className="truncate">IconicSkies</span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-xs font-medium text-cloud/82 sm:gap-2 sm:text-sm">
          <Link className="whitespace-nowrap rounded-md px-2 py-2 hover:bg-white/10 hover:text-cloud focus:outline-none focus:ring-2 focus:ring-horizon/70 sm:px-3" href="/">
            Weather
          </Link>
          {user ? (
            <>
              <Link
                className="whitespace-nowrap rounded-md px-2 py-2 hover:bg-white/10 hover:text-cloud focus:outline-none focus:ring-2 focus:ring-horizon/70 sm:px-3"
                href="/dashboard"
              >
                Journal
              </Link>
              <form action="/api/auth/logout" method="post">
                <button
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-md px-2 py-2 hover:bg-white/10 hover:text-cloud focus:outline-none focus:ring-2 focus:ring-horizon/70 sm:px-3"
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
                className="whitespace-nowrap rounded-md px-2 py-2 hover:bg-white/10 hover:text-cloud focus:outline-none focus:ring-2 focus:ring-horizon/70 sm:px-3"
                href="/login"
              >
                Sign in
              </Link>
              <Link
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-cloud px-2 py-2 text-skyInk hover:bg-white focus:outline-none focus:ring-2 focus:ring-horizon/70 sm:px-3"
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
