interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton rounded ${className}`} />;
}

/**
 * Product card skeleton for catalog grid loading state.
 */
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <Skeleton className="aspect-4/3 rounded-lg" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/**
 * Grid of product card skeletons for catalog page loading.
 */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Hero section skeleton for homepage loading.
 */
export function HeroSkeleton() {
  return (
    <div className="relative h-[85vh] animate-pulse">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute bottom-20 left-8 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-12 w-40 rounded-lg" />
      </div>
    </div>
  );
}
