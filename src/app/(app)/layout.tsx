import { Suspense } from "react";
import Link from "next/link";
import { AppNav } from "@/components/app/app-nav";
import { UserMenu } from "@/components/auth/user-menu";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
              OKR<span className="text-muted-foreground"> · Consolidate</span>
            </Link>
            <Suspense fallback={<nav className="hidden h-8 w-64 sm:block" />}>
              <AppNav />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <span className="text-sm text-muted-foreground">…</span>
            }
          >
            <UserMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
