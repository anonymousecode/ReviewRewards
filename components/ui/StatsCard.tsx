import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: LucideIcon
    iconColor?: string
    trend?: { value: number; label: string }
    className?: string
}

export function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = 'text-indigo-400',
    trend,
    className,
}: StatsCardProps) {
    return (
        <div className={cn(
            'glass-card rounded-2xl p-6 flex flex-col gap-4 hover:border-zinc-600/50 transition-colors group',
            className
        )}>
            <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm font-medium">{title}</span>
                <div className={cn('p-2 rounded-xl bg-zinc-800/60 group-hover:scale-110 transition-transform', iconColor)}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold text-zinc-100">{value}</div>
                {subtitle && <div className="text-zinc-500 text-sm mt-1">{subtitle}</div>}
            </div>
            {trend && (
                <div className={cn(
                    'text-xs font-medium flex items-center gap-1',
                    trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                )}>
                    <span>{trend.value >= 0 ? '↑' : '↓'}</span>
                    <span>{Math.abs(trend.value)}% {trend.label}</span>
                </div>
            )}
        </div>
    )
}
