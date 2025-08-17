import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'none'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }

  return (
    <div
      className={cn(
        'bg-white/10',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width || '100%',
        height: height || '20px'
      }}
    />
  )
}

// Specific skeleton components
export function ServerCardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" width={48} height={48} />
          <div>
            <Skeleton variant="text" width={150} height={20} className="mb-2" />
            <Skeleton variant="text" width={100} height={16} />
          </div>
        </div>
      </div>
      <Skeleton variant="text" width="100%" height={40} className="mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton variant="text" width={100} height={20} />
        <Skeleton variant="rounded" width={80} height={32} />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" width="100%" height={20} />
        </td>
      ))}
    </tr>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" height={20} className="mb-2" />
        <Skeleton variant="text" width="40%" height={16} />
      </div>
      <Skeleton variant="rounded" width={80} height={32} />
    </div>
  )
}

export function DashboardStatSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="rounded" width={48} height={48} />
        <Skeleton variant="circular" width={20} height={20} />
      </div>
      <Skeleton variant="text" width={60} height={32} className="mb-2" />
      <Skeleton variant="text" width={100} height={16} />
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton variant="text" width={100} height={16} className="mb-2" />
        <Skeleton variant="rounded" width="100%" height={40} />
      </div>
      <div>
        <Skeleton variant="text" width={100} height={16} className="mb-2" />
        <Skeleton variant="rounded" width="100%" height={40} />
      </div>
      <div>
        <Skeleton variant="text" width={100} height={16} className="mb-2" />
        <Skeleton variant="rounded" width="100%" height={80} />
      </div>
      <Skeleton variant="rounded" width={120} height={40} />
    </div>
  )
}

// Page-level skeletons
export function DiscoveryPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20">
        <Skeleton variant="rounded" width="100%" height={48} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ServerCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function ServersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/20">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton variant="rounded" width={48} height={48} />
                  <div>
                    <Skeleton variant="text" width={150} height={20} className="mb-2" />
                    <Skeleton variant="text" width={100} height={16} />
                  </div>
                </div>
                <Skeleton variant="rounded" width={80} height={24} />
              </div>
              
              <div className="space-y-2">
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="80%" height={16} />
              </div>
              
              <div className="flex gap-2">
                <Skeleton variant="rounded" width={100} height={32} />
                <Skeleton variant="rounded" width={100} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}