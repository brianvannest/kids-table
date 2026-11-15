import { listMyVisitsForPlace } from "@/lib/visits";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notice } from "@/components/ui/Notice";
import { deleteVisit } from "./actions";
import { LogVisitForm } from "./LogVisitForm";

// This person's own visits to this place, and a form to log another. Other people's visits are
// never read here: the query starts from the signed-in person's id.
export async function VisitsSection({ userId, restaurantId }: { userId: string; restaurantId: string }) {
  let visits;
  try {
    visits = await listMyVisitsForPlace(userId, restaurantId);
  } catch (error) {
    console.error("Couldn't list visits:", error instanceof Error ? error.message : error);
    return (
      <Notice kind="error">
        <p>Couldn&apos;t read your visits. Try again in a minute.</p>
      </Notice>
    );
  }

  return (
    <section aria-labelledby="visits-heading" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id="visits-heading" className="text-[22px] font-extrabold leading-7">
          Your visits
        </h2>
        <p className="text-sm text-muted">Only you can see these. Not even the owner can.</p>
      </div>

      {visits.length === 0 ? (
        <p>You haven&apos;t logged a visit here yet.</p>
      ) : (
        <ul className="grid max-w-xl overflow-hidden rounded-card border border-line bg-card">
          {visits.map((v) => (
            <li key={v.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-t border-line px-4 py-3 first:border-t-0">
              <div className="min-w-0">
                <p className="font-bold tabular-nums">{v.date}</p>
                {v.notes && <p className="whitespace-pre-line break-words text-ink">{v.notes}</p>}
              </div>
              <ConfirmDialog
                triggerLabel={`Delete the ${v.date} visit`}
                title="Delete this visit?"
                confirmLabel="Delete"
                action={deleteVisit}
                fields={{ visitId: v.id }}
              >
                <p>
                  The visit on {v.date} will be gone. This can&apos;t be undone.
                </p>
              </ConfirmDialog>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3">
        <h3 className="text-lg font-extrabold leading-6">Log a visit</h3>
        <LogVisitForm restaurantId={restaurantId} />
      </div>
    </section>
  );
}
