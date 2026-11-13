import Link from "next/link";
import { logoutAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { getAuthSession } from "@/lib/auth/session";

export async function UserMenu() {
  const session = await getAuthSession();

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Anmelden
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:inline">
        {session.user.displayName}
      </span>
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" size="sm">
          Abmelden
        </Button>
      </form>
    </div>
  );
}
