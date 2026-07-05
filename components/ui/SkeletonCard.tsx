"use client";

/** Loading skeleton for dashboard cards */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl p-4 animate-pulse bg-fond-surface border border-bordure">
      <div className="h-4 w-2/3 rounded mb-3 bg-bordure" />
      <div className="h-3 w-1/2 rounded mb-2 bg-bordure" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="h-3 w-4/5 rounded mb-1.5 bg-bordure" />
      ))}
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 p-3 animate-pulse border-b border-bordure">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 flex-1 rounded bg-bordure" />
      ))}
    </div>
  );
}

export function SkeletonToday() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 bg-fond-surface border border-bordure">
          <div className="h-4 w-1/3 rounded mb-3 bg-bordure" />
          <div className="h-3 w-2/3 rounded mb-2 bg-bordure" />
          <div className="h-8 w-1/2 rounded mt-3 bg-bordure" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-1/2 rounded bg-bordure" />
      <div className="h-4 w-3/4 rounded bg-bordure" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-fond-surface border border-bordure" />
        ))}
      </div>
      <div className="h-40 rounded-xl bg-fond-surface border border-bordure" />
    </div>
  );
}
