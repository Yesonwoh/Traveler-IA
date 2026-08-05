import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({
  size = 28,
  textClassName,
  light = false,
}: {
  size?: number;
  textClassName?: string;
  light?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <Image
        src="/logo.png"
        alt="Traveler IA"
        width={size}
        height={size}
        className="rounded-full"
        priority
      />
      <span
        className={cn(
          "font-black tracking-tight",
          light ? "text-white" : "text-brand-dark",
          textClassName
        )}
      >
        Traveler IA
      </span>
    </span>
  );
}
