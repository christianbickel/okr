import { cn } from "@/lib/utils";

/** Native select that respects parent width (long option labels won't blow the layout). */
export function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-8 w-full min-w-0 max-w-full rounded-lg border border-input bg-transparent px-2.5 text-sm",
        className
      )}
      {...props}
    />
  );
}
