import { cn } from "@/lib/utils";

export function PresenceBadge({ online, className }: { online: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        online ? "text-success" : "text-muted-foreground",
        className,
      )}
      title={online ? "Online now" : "Offline"}
    >
      <span className={cn("h-2 w-2 rounded-full", online ? "bg-success" : "bg-muted-foreground")} />
      {online ? "Online" : "Offline"}
    </span>
  );
}
