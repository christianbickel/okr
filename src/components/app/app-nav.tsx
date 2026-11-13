import Link from "next/link";
import { getAuthSession } from "@/lib/auth/session";

const BASE_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/objectives", label: "Objectives" },
  { href: "/cycles", label: "Zyklen" },
  { href: "/alignment", label: "Alignment" },
] as const;

export async function AppNav() {
  const session = await getAuthSession();
  const items = session
    ? [...BASE_NAV, { href: "/drive", label: "Drive" }]
    : [...BASE_NAV];

  return (
    <nav className="hidden items-center gap-1 sm:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
