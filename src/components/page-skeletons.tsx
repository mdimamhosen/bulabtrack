import { Card, CardContent } from "@/components/ui/card";

// Generic Pulse Base
function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-zinc-900 border border-zinc-900/60 ${className}`}
    />
  );
}

// 1. Homepage Loading Skeleton
export function HomepageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16 space-y-16 animate-pulse">
      {/* Hero Skeleton */}
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center min-h-[70vh]">
        <div className="space-y-6">
          <SkeletonPulse className="h-6 w-44" />
          <SkeletonPulse className="h-14 w-full" />
          <SkeletonPulse className="h-14 w-3/4" />
          <SkeletonPulse className="h-6 w-5/6" />
          <div className="flex gap-4">
            <SkeletonPulse className="h-12 w-36 rounded-2xl" />
            <SkeletonPulse className="h-12 w-36 rounded-2xl" />
          </div>
        </div>
        <SkeletonPulse className="aspect-[16/11] w-full rounded-[2.5rem] p-3" />
      </div>

      {/* Brand Bar Skeleton */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-6 py-6 border-y border-zinc-800">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-6 w-20 mx-auto" />
        ))}
      </div>
    </div>
  );
}

// 2. Product Catalog Page Skeleton
export function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16 space-y-8 animate-pulse">
      <div className="space-y-3">
        <SkeletonPulse className="h-5 w-32" />
        <SkeletonPulse className="h-12 w-1/2" />
        <SkeletonPulse className="h-6 w-1/3" />
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-72 space-y-6">
          <SkeletonPulse className="h-20 w-full" />
          <SkeletonPulse className="h-48 w-full" />
          <SkeletonPulse className="h-48 w-full" />
        </aside>
        <div className="flex-1 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonPulse key={i} className="h-[360px] w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// 3. Product Detail Page Skeleton
export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16 space-y-8 animate-pulse">
      <div className="flex items-center gap-2">
        <SkeletonPulse className="h-4 w-12" />
        <span className="text-zinc-800">/</span>
        <SkeletonPulse className="h-4 w-16" />
        <span className="text-zinc-800">/</span>
        <SkeletonPulse className="h-4 w-28" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <SkeletonPulse className="aspect-square w-full rounded-[2rem]" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonPulse key={i} className="h-20 w-20" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <SkeletonPulse className="h-6 w-24" />
          <SkeletonPulse className="h-10 w-4/5" />
          <SkeletonPulse className="h-4 w-1/3" />
          <div className="space-y-2">
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-5/6" />
          </div>
          <SkeletonPulse className="h-12 w-28" />
          <div className="flex gap-3 pt-4 border-t border-zinc-800">
            <SkeletonPulse className="h-12 w-32" />
            <SkeletonPulse className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Checkout Page Skeleton
export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16 space-y-8 animate-pulse">
      <SkeletonPulse className="h-5 w-40" />
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Form */}
        <div className="space-y-6">
          <SkeletonPulse className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SkeletonPulse className="h-10 w-full" />
            <SkeletonPulse className="h-10 w-full" />
            <SkeletonPulse className="h-10 w-full sm:col-span-2" />
            <SkeletonPulse className="h-10 w-full" />
            <SkeletonPulse className="h-10 w-full" />
          </div>
          <SkeletonPulse className="h-24 w-full" />
        </div>
        {/* Right Summary */}
        <div className="space-y-4">
          <SkeletonPulse className="h-6 w-36" />
          <Card className="border-zinc-800 bg-zinc-950/20">
            <CardContent className="p-6 space-y-4">
              <SkeletonPulse className="h-12 w-full" />
              <SkeletonPulse className="h-12 w-full" />
              <div className="border-t border-zinc-800 pt-4 flex justify-between">
                <SkeletonPulse className="h-5 w-16" />
                <SkeletonPulse className="h-6 w-24" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 5. Dashboard Page Skeleton
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6 animate-pulse">
      {/* Banner */}
      <SkeletonPulse className="h-24 w-full rounded-2xl" />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonPulse className="h-24 w-full" />
        <SkeletonPulse className="h-24 w-full" />
        <SkeletonPulse className="h-24 w-full" />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonPulse className="h-80 w-full rounded-2xl" />
          <SkeletonPulse className="h-60 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <SkeletonPulse className="h-96 w-full rounded-2xl" />
          <SkeletonPulse className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// 6. About Page Skeleton
export function AboutSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16 space-y-12 animate-pulse">
      {/* Title */}
      <div className="space-y-3 text-center">
        <SkeletonPulse className="h-5 w-24 mx-auto" />
        <SkeletonPulse className="h-12 w-2/3 mx-auto" />
        <SkeletonPulse className="h-6 w-1/2 mx-auto" />
      </div>

      {/* Mission Grid */}
      <div className="grid gap-6 sm:grid-cols-3">
        <SkeletonPulse className="h-48 w-full" />
        <SkeletonPulse className="h-48 w-full" />
        <SkeletonPulse className="h-48 w-full" />
      </div>

      {/* Showcase Grid */}
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        <SkeletonPulse className="h-64 w-full" />
        <SkeletonPulse className="h-40 w-full" />
        <SkeletonPulse className="h-52 w-full" />
        <SkeletonPulse className="h-60 w-full" />
        <SkeletonPulse className="h-48 w-full" />
      </div>
    </div>
  );
}

// 7. Contact Page Skeleton
export function ContactSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8 lg:py-16 space-y-8 animate-pulse">
      <div className="space-y-3 text-center">
        <SkeletonPulse className="h-5 w-24 mx-auto" />
        <SkeletonPulse className="h-12 w-2/3 mx-auto" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <SkeletonPulse className="h-24 w-full" />
          <SkeletonPulse className="h-24 w-full" />
          <SkeletonPulse className="h-24 w-full" />
        </div>
        <div className="space-y-4">
          <SkeletonPulse className="h-10 w-full" />
          <SkeletonPulse className="h-10 w-full" />
          <SkeletonPulse className="h-10 w-full" />
          <SkeletonPulse className="h-32 w-full" />
          <SkeletonPulse className="h-12 w-32" />
        </div>
      </div>
    </div>
  );
}
