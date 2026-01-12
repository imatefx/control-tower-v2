import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-500 text-white hover:bg-emerald-500/80",
        warning: "border-transparent bg-amber-500 text-white hover:bg-amber-500/80",
        info: "border-transparent bg-blue-500 text-white hover:bg-blue-500/80",
        purple: "border-transparent bg-purple-500 text-white hover:bg-purple-500/80",
        rose: "border-transparent bg-rose-500 text-white hover:bg-rose-500/80",
        indigo: "border-transparent bg-indigo-500 text-white hover:bg-indigo-500/80",
        cyan: "border-transparent bg-cyan-500 text-white hover:bg-cyan-500/80",
        pink: "border-transparent bg-pink-500 text-white hover:bg-pink-500/80",
        slate: "border-transparent bg-slate-500 text-white hover:bg-slate-500/80",
        // Soft variants for backgrounds
        "success-soft": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        "warning-soft": "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        "info-soft": "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
        "destructive-soft": "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
        "purple-soft": "border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
