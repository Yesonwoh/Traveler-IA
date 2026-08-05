export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mx-auto h-8 w-40 animate-pulse rounded-lg bg-stone-200" />
      <div className="mx-auto mt-3 h-4 w-72 animate-pulse rounded bg-stone-100" />
      <div className="mx-auto mt-6 h-20 max-w-2xl animate-pulse rounded-2xl bg-stone-100" />

      <div className="mx-auto mt-6 grid max-w-[932px] grid-cols-[repeat(auto-fit,minmax(240px,300px))] justify-center gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="h-36 w-full animate-pulse bg-stone-200" />
            <div className="p-4">
              <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
