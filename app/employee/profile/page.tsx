'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatsCard } from '@/components/ui/StatsCard'
import { Award, Star, CheckCircle, TrendingUp } from 'lucide-react'
import { getRankIcon, startOfMonth, endOfMonth } from '@/lib/utils'
import type { Profile, Review } from '@/lib/types'

export default function EmployeeProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [rank, setRank] = useState<number>(0)
    const [monthlyApproved, setMonthlyApproved] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            setProfile(p)

            const { data: myReviews } = await supabase
                .from('reviews').select('*').eq('employee_id', user.id).order('created_at', { ascending: false })
            setReviews(myReviews || [])

            // Monthly approved
            const now = new Date()
            const monthly = (myReviews || []).filter((r: Review) =>
                r.status === 'approved' &&
                r.created_at >= startOfMonth(now) &&
                r.created_at <= endOfMonth(now)
            )
            setMonthlyApproved(monthly.length)

            // Compute rank: position of this employee by total_points descending
            const { data: allProfiles } = await supabase
                .from('profiles')
                .select('id, total_points')
                .eq('role', 'employee')
                .eq('is_active', true)
                .eq('is_deleted', false)
                .order('total_points', { ascending: false })

            const idx = (allProfiles || []).findIndex((ep: any) => ep.id === user.id)
            setRank(idx >= 0 ? idx + 1 : 0)
            setLoading(false)
        }
        load()
    }, [])

    const totalApproved = reviews.filter(r => r.status === 'approved').length

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />)}
                </div>
                <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Hero profile */}
            <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-600 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 shadow-lg shadow-indigo-500/30">
                    {profile?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-center sm:text-left flex-1">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{profile?.name}</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">{profile?.email}</p>
                    <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                        <span className="text-2xl">{getRankIcon(rank)}</span>
                        <div className="bg-indigo-500/15 border border-indigo-500/30 rounded-xl px-4 py-1.5 flex items-center">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">{profile?.total_points}</span>
                            <span className="text-zinc-500 dark:text-zinc-400 text-sm ml-1">points</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Points" value={profile?.total_points ?? 0} icon={Award} iconColor="text-indigo-600 dark:text-indigo-400" />
                <StatsCard title="Your Rank" value={rank > 0 ? `#${rank}` : '—'} icon={TrendingUp} iconColor="text-amber-600 dark:text-amber-400" />
                <StatsCard title="Approved Reviews" value={totalApproved} icon={CheckCircle} iconColor="text-emerald-600 dark:text-emerald-400" />
                <StatsCard title="This Month" value={monthlyApproved} icon={Star} iconColor="text-violet-600 dark:text-violet-400" subtitle="approved reviews" />
            </div>

            {/* Recent submissions */}
            <div className="glass-card rounded-2xl p-6">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-200 mb-4">Recent Submissions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                                <th className="text-left py-2 pr-4 font-medium">Date</th>
                                <th className="text-left py-2 pr-4 font-medium">Status</th>
                                <th className="text-left py-2 pr-4 font-medium">Points</th>
                                <th className="text-left py-2 font-medium">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                            {reviews.length === 0 && (
                                <tr><td colSpan={4} className="py-8 text-center text-zinc-500">No submissions yet.</td></tr>
                            )}
                            {reviews.slice(0, 10).map(r => (
                                <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                    <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                                    <td className="py-3 pr-4 font-semibold text-indigo-600 dark:text-indigo-400">
                                        {r.status === 'approved' ? `+${r.points_awarded}` : '—'}
                                    </td>
                                    <td className="py-3 text-zinc-500 dark:text-zinc-400 text-xs">{r.rejection_reason ?? ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
