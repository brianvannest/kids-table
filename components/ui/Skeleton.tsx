// The shape of a list while it loads. It's still, with no shimmer, and a screen reader hears
// "Loading" instead of a pile of empty boxes.
export function SkeletonCards({ count = 4, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <div>
      <p className="sr-only" role="status">
        {label}
      </p>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="h-28 rounded-card bg-sand" />
        ))}
      </div>
    </div>
  );
}
