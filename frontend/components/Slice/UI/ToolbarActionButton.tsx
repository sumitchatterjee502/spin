"use client";

import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type ToolbarActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
};

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<NonNullable<ToolbarActionButtonProps["variant"]>, string> = {
  primary: "border border-transparent bg-slate-900 text-white shadow-sm hover:bg-slate-800",
  secondary:
    "border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
};

export default function ToolbarActionButton({
  variant = "secondary",
  icon: Icon,
  className = "",
  children,
  type = "button",
  ...props
}: ToolbarActionButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {Icon ? (
        <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}
