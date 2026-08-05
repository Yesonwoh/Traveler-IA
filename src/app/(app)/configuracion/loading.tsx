export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-stone-100" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl border border-stone-200 bg-white"
        />
      ))}
    </div>
  );
}
