import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trafficStatusLabel } from "@/lib/okr/status";
import type { TrafficStatus } from "@/lib/okr/types";

const STATUS_STYLES: Record<TrafficStatus, string> = {
  on_track:
    "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  at_risk:
    "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-400",
  off_track:
    "border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

const DOT_STYLES: Record<TrafficStatus, string> = {
  on_track: "bg-emerald-500",
  at_risk: "bg-amber-500",
  off_track: "bg-rose-500",
};

interface StatusBadgeProps {
  status: TrafficStatus;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  className,
  showDot = true,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_STYLES[status], "rounded-md font-medium", className)}
    >
      {showDot ? (
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", DOT_STYLES[status])}
        />
      ) : null}
      {trafficStatusLabel(status)}
    </Badge>
  );
}
