import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "outline" | "premium";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-neutral-900 text-white",
    secondary: "bg-neutral-100 text-neutral-900",
    outline: "border border-neutral-200 text-neutral-700",
    premium: "bg-linear-to-r from-amber-500 to-amber-600 text-white",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };
