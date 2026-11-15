import { connection } from "next/server";
import { listMembers } from "@/lib/members";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notice } from "@/components/ui/Notice";
import { TagPill } from "@/components/ui/TagPill";
import { table } from "@/components/ui/table";
import { changeMember } from "./actions";

const statusLabel = { waiting: "Waiting", member: "Member", removed: "Removed" } as const;
const statusTone = { waiting: "sun", member: "teal", removed: "plain" } as const;

// Everyone with an account, with what the owner can do about each. Runs on the server and reads
// live data, so the page wraps it in Suspense.
export async function MembersList() {
  await connection();
  let people;
  try {
    people = await listMembers();
  } catch (error) {
    console.error("Couldn't list members:", error instanceof Error ? error.message : error);
    return (
      <Notice kind="error">
        <p>Couldn&apos;t read the list of people. Try again in a minute.</p>
      </Notice>
    );
  }

  return (
    <div className={table.wrap} tabIndex={0} role="region" aria-label="Everyone with an account. Scrolls sideways on a small screen.">
      <table className={table.table}>
        <caption className="sr-only">Everyone with an account</caption>
        <thead>
          <tr>
            <th scope="col" className={table.th}>Name</th>
            <th scope="col" className={table.th}>Email</th>
            <th scope="col" className={table.th}>Status</th>
            <th scope="col" className={table.th}>Joined</th>
            <th scope="col" className={table.th}>What you can do</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id}>
              <td className={`${table.td} font-bold`}>{p.name}</td>
              <td className={table.td}>{p.email}</td>
              <td className={table.td}>
                {p.role === "owner" ? <TagPill tone="mint">Owner</TagPill> : <TagPill tone={statusTone[p.status]}>{statusLabel[p.status]}</TagPill>}
              </td>
              <td className={`${table.td} tabular-nums`}>{p.joined}</td>
              <td className={table.td}>
                <div className="flex flex-wrap items-center gap-2">
                  {p.role === "owner" && <span className="text-muted">That&apos;s you</span>}
                  {p.role !== "owner" && p.status === "waiting" && (
                    <>
                      <form action={changeMember}>
                        <input type="hidden" name="userId" value={p.id} />
                        <input type="hidden" name="action" value="approve" />
                        <Button type="submit">Approve {p.name}</Button>
                      </form>
                      <ConfirmDialog
                        triggerLabel={`Decline ${p.name}`}
                        title={`Decline ${p.name}?`}
                        confirmLabel="Decline"
                        action={changeMember}
                        fields={{ userId: p.id, action: "decline" }}
                      >
                        <p>They won&apos;t get in. They&apos;ll see that their account doesn&apos;t have access.</p>
                      </ConfirmDialog>
                    </>
                  )}
                  {p.role !== "owner" && p.status === "member" && (
                    <ConfirmDialog
                      triggerLabel={`Remove ${p.name}`}
                      title={`Remove ${p.name}?`}
                      confirmLabel="Remove"
                      action={changeMember}
                      fields={{ userId: p.id, action: "remove" }}
                    >
                      <p>They&apos;ll be signed out right away and won&apos;t be able to see the members&apos; area. You can let them back in later.</p>
                    </ConfirmDialog>
                  )}
                  {p.role !== "owner" && p.status === "removed" && (
                    <form action={changeMember}>
                      <input type="hidden" name="userId" value={p.id} />
                      <input type="hidden" name="action" value="restore" />
                      <Button type="submit" variant="secondary">Let {p.name} back in</Button>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
