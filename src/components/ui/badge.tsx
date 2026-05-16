import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "teal" | "amber" | "rose";
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border px-1.5 text-[11px] font-medium",
        tone === "default" && "border-slate-700 bg-slate-900 text-slate-300",
        tone === "teal" && "border-teal-400/30 bg-teal-400/10 text-teal-200",
        tone === "amber" && "border-amber-400/30 bg-amber-400/10 text-amber-200",
        tone === "rose" && "border-rose-400/30 bg-rose-400/10 text-rose-200",
        className,
      )}
      {...props}
    />
  );
}
