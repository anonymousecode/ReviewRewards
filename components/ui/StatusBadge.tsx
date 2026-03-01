import { cn, getStatusColor } from '@/lib/utils'

interface StatusBadgeProps {
    status: string
    className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize',
                getStatusColor(status),
                status === 'pending' && 'badge-pending',
                className
            )}
        >
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
            {status}
        </span>
    )
}
