"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type CollapsibleVariant = "dark" | "light";

type CollapsibleSectionProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  summary?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: CollapsibleVariant;
};

const variantClasses: Record<CollapsibleVariant, { shell: string; border: string; button: string; subtitle: string; summary: string; panel: string }> = {
  dark: {
    shell: "border-white/14 bg-[#09171c]/88 text-cloud shadow-[0_18px_44px_rgba(0,0,0,0.28)] backdrop-blur-xl",
    border: "border-white/10",
    button: "hover:bg-white/5 focus-visible:bg-white/6",
    subtitle: "text-cloud/78",
    summary: "text-cloud/72",
    panel: "border-t border-white/10 bg-black/10",
  },
  light: {
    shell: "border-slate-200 bg-[#f4f7f4] text-slate-950 shadow-[0_14px_40px_rgba(15,23,42,0.08)]",
    border: "border-slate-200",
    button: "hover:bg-slate-50 focus-visible:bg-slate-50",
    subtitle: "text-slate-700",
    summary: "text-slate-600",
    panel: "border-t border-slate-200 bg-white/65",
  },
};

export function CollapsibleSection({
  title,
  subtitle,
  summary,
  icon,
  action,
  children,
  className = "",
  contentClassName = "",
  defaultOpen = false,
  open,
  onOpenChange,
  variant = "dark",
}: CollapsibleSectionProps) {
  const id = useId();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;
  const classes = variantClasses[variant];

  function toggleOpen() {
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <section className={`overflow-hidden rounded-2xl border ${classes.shell} ${className}`}>
      <div className={`flex flex-col gap-3 border-b ${classes.border} p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4`}>
        <button
          aria-controls={id}
          aria-expanded={isOpen}
          className={`flex min-w-0 flex-1 items-start gap-3 rounded-xl px-1 py-0.5 text-left transition ${classes.button} focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora/30`}
          type="button"
          onClick={toggleOpen}
        >
          {icon ? (
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-black/18 text-current">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-inherit">{title}</p>
              {summary ? <span className={`text-sm font-medium ${classes.summary}`}>{summary}</span> : null}
            </div>
            {subtitle ? <p className={`mt-1 max-w-2xl text-sm leading-6 ${classes.subtitle}`}>{subtitle}</p> : null}
          </div>
          <ChevronDown
            aria-hidden
            className={`mt-1 size-4 shrink-0 transition duration-200 ${isOpen ? "rotate-180" : "rotate-0"} ${variant === "dark" ? "text-cloud/70" : "text-slate-700"}`}
          />
        </button>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {isOpen ? (
        <div id={id} className={contentClassName}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
