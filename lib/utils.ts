import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatPoints(points: number): string {
    return points.toLocaleString()
}

export function getStatusColor(status: string) {
    switch (status) {
        case 'approved':
        case 'delivered':
            return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        case 'pending':
            return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        case 'rejected':
            return 'bg-red-500/20 text-red-400 border-red-500/30'
        default:
            return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
}

export function getRankIcon(rank: number): string {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
}

export function getMonthName(date: Date): string {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' })
}

export function startOfMonth(date: Date): string {
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
}

export function endOfMonth(date: Date): string {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()
}
