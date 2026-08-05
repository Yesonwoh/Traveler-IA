import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center">
          <Logo size={36} textClassName="text-2xl" />
        </Link>
        <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
