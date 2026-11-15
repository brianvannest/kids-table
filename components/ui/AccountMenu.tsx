import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { isApproved, isOwner } from "@/lib/memberRules";
import { Avatar } from "./Avatar";
import { buttonClass } from "./Button";
import { SignOutButton } from "./SignOutButton";

// The right-hand side of the header: Sign in for a visitor, or the person's name and their links.
// It asks who's signed in, which depends on the visitor's cookie, so it runs when someone asks for
// the page, and the header wraps it in Suspense.
export async function AccountMenu() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/sign-in" className={buttonClass("secondary")}>
        Sign in
      </Link>
    );
  }

  return (
    <nav aria-label="Your account" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
      {isApproved(user) && <Link href="/places">Places</Link>}
      {isOwner(user) && (
        <>
          <Link href="/members">Members</Link>
          <Link href="/import">Import</Link>
        </>
      )}
      {!isApproved(user) && <Link href="/waiting">Waiting for approval</Link>}
      <span className="inline-flex items-center gap-2">
        <Avatar name={user.name} />
        <span className="hidden font-bold sm:inline">{user.name}</span>
      </span>
      <SignOutButton />
    </nav>
  );
}
