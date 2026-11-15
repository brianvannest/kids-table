import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { isApproved, isOwner, readRole, readStatus, type Person } from "@/lib/memberRules";

// Every page and every action that needs to know who's signed in asks here. The answer comes from
// the database on each request, so approving or removing someone takes effect on their next click.
//
// Pages use the `require...` functions, which send a visitor somewhere useful. Actions use the
// `owner...` function, which just says no: an action can be called by anyone who sends the right
// request, so it has to check for itself, every time.

/** The person who's signed in right now, or null. Never throws. */
export async function getCurrentUser(): Promise<Person | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    const user = session?.user as (Record<string, unknown> & { id: string; name: string; email: string }) | undefined;
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email, role: readRole(user.role), status: readStatus(user.status) };
  } catch (error) {
    console.error("Couldn't read the session:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** For a page that needs someone signed in. Anyone else goes to the sign-in page. */
export async function requireSignedIn(): Promise<Person> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** For a members-only page. Not signed in goes to sign-in. Waiting or removed goes to the waiting screen. */
export async function requireApprovedMember(): Promise<Person> {
  const user = await requireSignedIn();
  if (!isApproved(user)) redirect("/waiting");
  return user;
}

/** For an owner-only page. Anyone who isn't the owner goes home. */
export async function requireOwnerPage(): Promise<Person> {
  const user = await requireSignedIn();
  if (!isOwner(user)) redirect("/");
  return user;
}

/** For an owner-only action. Returns the owner, or null. The action must stop on null. */
export async function ownerForAction(): Promise<Person | null> {
  const user = await getCurrentUser();
  return isOwner(user) ? user : null;
}

/** For an action any approved member may use. Returns the member (the owner counts), or null. */
export async function memberForAction(): Promise<Person | null> {
  const user = await getCurrentUser();
  return user && isApproved(user) ? user : null;
}
