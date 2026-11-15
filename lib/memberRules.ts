// Who is allowed to do what. Plain functions with no imports, so they can be tested alone and so
// every page and action asks the same questions the same way.
//
// A person has a role and a status:
//   role    owner | member
//   status  waiting (signed up, not approved yet) | member (approved) | removed
// The owner decides who is in the group. There is exactly one owner.

export type Role = "owner" | "member";
export type Status = "waiting" | "member" | "removed";

export type Person = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
};

/** Emails are compared without capital letters or stray spaces. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * What a brand-new account starts as. Everyone starts as a member who is waiting, except the one
 * person whose email matches the owner's email, and only while no owner exists yet.
 */
export function startingAccess(
  email: string,
  ownerEmail: string | undefined,
  ownerExists: boolean,
): { role: Role; status: Status } {
  const matches = Boolean(ownerEmail?.trim()) && normalizeEmail(email) === normalizeEmail(ownerEmail ?? "");
  return matches && !ownerExists ? { role: "owner", status: "member" } : { role: "member", status: "waiting" };
}

/** Can this person see the members' area? Only approved people. A waiting or removed person can't. */
export function isApproved(person: Pick<Person, "status"> | null | undefined): boolean {
  return person?.status === "member";
}

/** Can this person approve, decline, and remove others, and bring in a spreadsheet? Only the owner. */
export function isOwner(person: Pick<Person, "role" | "status"> | null | undefined): boolean {
  return person?.role === "owner" && person.status === "member";
}

export type MemberAction = "approve" | "decline" | "remove" | "restore";

export const MEMBER_ACTIONS: readonly MemberAction[] = ["approve", "decline", "remove", "restore"];

/** What status an action leads to, or null if the action isn't allowed for that person. */
export function applyAction(target: Pick<Person, "role" | "status">, action: string): Status | null {
  if (target.role === "owner") return null; // the owner can't be changed by anyone
  switch (action) {
    case "approve":
      return target.status === "waiting" ? "member" : null;
    case "decline":
      return target.status === "waiting" ? "removed" : null;
    case "remove":
      return target.status === "member" ? "removed" : null;
    case "restore":
      return target.status === "removed" ? "member" : null;
    default:
      return null;
  }
}

/** Reads a status from the database, treating anything unexpected as the safest one: no access. */
export function readStatus(value: unknown): Status {
  return value === "member" || value === "waiting" || value === "removed" ? value : "removed";
}

export function readRole(value: unknown): Role {
  return value === "owner" ? "owner" : "member";
}
