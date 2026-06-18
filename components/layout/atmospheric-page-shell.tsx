import type { ReactNode } from "react";

function backgroundClasses(variant: "dashboard" | "error") {
  switch (variant) {
    case "error":
      return "bg-[radial-gradient(circle_at_18%_12%,rgba(216,138,75,0.18),transparent_18rem),radial-gradient(circle_at_82%_18%,rgba(123,198,164,0.14),transparent_20rem),linear-gradient(180deg,#050c12_0%,#07141b_55%,#050c12_100%)]";
    default:
      return "bg-[radial-gradient(circle_at_18%_12%,rgba(123,198,164,0.12),transparent_18rem),radial-gradient(circle_at_82%_10%,rgba(216,138,75,0.14),transparent_20rem),linear-gradient(180deg,#050c12_0%,#07131a_55%,#050c12_100%)]";
  }
}

export function AtmosphericPageShell({
  children,
  variant = "dashboard",
  className = "",
}: {
  children: ReactNode;
  variant?: "dashboard" | "error";
  className?: string;
}) {
  return (
    <div className={`relative isolate min-h-[calc(100vh-65px)] overflow-hidden text-cloud ${backgroundClasses(variant)} ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.08)_0%,rgba(5,12,18,0)_22%,rgba(5,12,18,0.12)_100%)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {children}
      </div>
    </div>
  );
}
