import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 placeholder:text-stone-500 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
