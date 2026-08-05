import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Avatar({
  fotoUrl,
  inicial,
  isPremium,
  size = "md",
}: {
  fotoUrl?: string;
  inicial: string;
  isPremium?: boolean;
  size?: "md" | "lg";
}) {
  const dimensions = size === "lg" ? "h-16 w-16 text-xl" : "h-9 w-9 text-sm";

  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full bg-brand font-bold text-white",
          dimensions,
          isPremium && "ring-2 ring-amber-400 ring-offset-2"
        )}
      >
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          inicial
        )}
      </span>
      {isPremium && (
        <span
          className={cn(
            "absolute -right-1 -top-1 flex items-center justify-center rounded-full bg-amber-400 text-white shadow",
            size === "lg" ? "h-6 w-6" : "h-4 w-4"
          )}
          title="Premium"
        >
          <Crown size={size === "lg" ? 14 : 10} fill="currentColor" />
        </span>
      )}
    </span>
  );
}
