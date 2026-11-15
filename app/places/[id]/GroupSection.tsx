import { getMyReview, listReviewsForPlace } from "@/lib/reviews";
import { summarizeRatings } from "@/lib/reviewRules";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notice } from "@/components/ui/Notice";
import { ReviewForm } from "./ReviewForm";
import { deleteReview } from "./reviewActions";

// What the group thinks of this place, and this person's own review. Only approved members ever
// reach this: the page checks first. Reviews are shown as plain text.
export async function GroupSection({ userId, restaurantId }: { userId: string; restaurantId: string }) {
  let reviews;
  let mine;
  try {
    [reviews, mine] = await Promise.all([listReviewsForPlace(restaurantId, userId), getMyReview(userId, restaurantId)]);
  } catch (error) {
    console.error("Couldn't load reviews:", error instanceof Error ? error.message : error);
    return (
      <Notice kind="error">
        <p>Couldn&apos;t read the reviews. Try again in a minute.</p>
      </Notice>
    );
  }

  const { count, average } = summarizeRatings(reviews.map((r) => r.rating));

  return (
    <section aria-labelledby="group-heading" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id="group-heading" className="text-[22px] font-extrabold leading-7">
          What the group thinks
        </h2>
        <p>
          {average === null ? (
            "No reviews yet. Be the first."
          ) : (
            <>
              <span className="font-bold">{average} out of 5</span> from {count} {count === 1 ? "review" : "reviews"}
            </>
          )}
        </p>
      </div>

      {reviews.length > 0 && (
        <ul className="grid max-w-xl overflow-hidden rounded-card border border-line bg-card" aria-label="Reviews">
          {reviews.map((r) => (
            <li key={r.id} className="border-t border-line px-4 py-3 first:border-t-0">
              <p className="font-bold">
                {r.mine ? `${r.name} (you)` : r.name} <span aria-hidden="true">·</span> <span className="tabular-nums">{r.rating} out of 5</span>
              </p>
              {r.note && <p className="whitespace-pre-line break-words">{r.note}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3">
        <h3 className="text-lg font-extrabold leading-6">{mine ? "Your review" : "Write a review"}</h3>
        <ReviewForm restaurantId={restaurantId} existing={mine} />
        {mine && (
          <div>
            <ConfirmDialog
              triggerLabel="Delete my review"
              title="Delete your review?"
              confirmLabel="Delete"
              action={deleteReview}
              fields={{ restaurantId }}
            >
              <p>Your rating and note will be gone. You can write a new one any time.</p>
            </ConfirmDialog>
          </div>
        )}
      </div>
    </section>
  );
}
