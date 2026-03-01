'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatsCard } from '@/components/ui/StatsCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getRankIcon, startOfMonth, endOfMonth, getMonthName } from '@/lib/utils'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import {
    Star, CheckCircle, Clock, Users, Award, TrendingUp
} from 'lucide-react'
import type { Profile, Review } from '@/lib/types'

interface LeaderboardEntry {
    id: string
    name: string
    total_points: number
    approved_count: number
}

interface ChartDataPoint {
    month: string
    reviews: number
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalReviews: 0, monthlyReviews: 0, approved: 0, pending: 0, totalPoints: 0
    })
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [recentReviews, setRecentReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const supabase = createClient()
            const now = new Date()
            const monthStart = startOfMonth(now)
            const monthEnd = endOfMonth(now)

            // All reviews
            const { data: allReviews } = await supabase
                .from('reviews').select('id, status, points_awarded, created_at, employee_id, profiles(name)')

            // Monthly reviews
            const { data: monthlyReviews } = await supabase
                .from('reviews').select('id')
                .gte('created_at', monthStart).lte('created_at', monthEnd)

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, total_points')
                .eq('role', 'employee')
                .eq('is_active', true)
                .eq('is_deleted', false)
                .order('total_points', { ascending: false })
                .limit(5)

            // Count approved reviews per employee
            const { data: approvedReviews } = await supabase
                .from('reviews').select('employee_id').eq('status', 'approved')

            const countMap: Record<string, number> = {}
            approvedReviews?.forEach(r => {
                countMap[r.employee_id] = (countMap[r.employee_id] || 0) + 1
            })

            const lb: LeaderboardEntry[] = (profiles || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                total_points: p.total_points,
                approved_count: countMap[p.id] || 0,
            }))

            // Build last 6 months chart
            const chartArr: ChartDataPoint[] = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
                const count = (allReviews || []).filter(r =>
                    r.created_at >= start && r.created_at <= end && r.status === 'approved'
                ).length
                chartArr.push({ month: d.toLocaleString('default', { month: 'short' }), reviews: count })
            }

            const totalPoints = (allReviews || []).reduce((sum, r) => sum + (r.points_awarded || 0), 0)
            const pending = (allReviews || []).filter(r => r.status === 'pending').length
            const approved = (allReviews || []).filter(r => r.status === 'approved').length

            setStats({
                totalReviews: allReviews?.length || 0,
                monthlyReviews: monthlyReviews?.length || 0,
                approved,
                pending,
                totalPoints,
            })
            setLeaderboard(lb)
            setChartData(chartArr)

            // Recent 5 reviews
            const recent = (allReviews || [])
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5) as unknown as Review[]
            setRecentReviews(recent)
            setLoading(false)
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />)}
                </div>
                <div className="h-72 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{getMonthName(new Date())} Overview</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatsCard title="Total Reviews" value={stats.totalReviews} icon={Star} iconColor="text-violet-600 dark:text-violet-400" />
                <StatsCard title="This Month" value={stats.monthlyReviews} icon={TrendingUp} iconColor="text-blue-600 dark:text-blue-400" />
                <StatsCard title="Approved" value={stats.approved} icon={CheckCircle} iconColor="text-emerald-600 dark:text-emerald-400" />
                <StatsCard title="Pending" value={stats.pending} icon={Clock} iconColor="text-amber-600 dark:text-amber-400" />
                <StatsCard title="Points Given" value={stats.totalPoints} icon={Award} iconColor="text-indigo-600 dark:text-indigo-400" className="col-span-2 lg:col-span-1" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="glass-card rounded-2xl p-6">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-200 mb-6">Approved Reviews (Last 6 Months)</h2>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: 'currentColor', fontSize: 12 }} className="text-zinc-400 dark:text-zinc-500" axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'currentColor', fontSize: 12 }} className="text-zinc-400 dark:text-zinc-500" axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--background)',
                                        borderColor: 'currentColor',
                                        borderRadius: '12px',
                                        fontSize: '12px'
                                    }}
                                    className="text-zinc-200 dark:text-zinc-800 border-zinc-200 dark:border-zinc-700"
                                    cursor={{ fill: 'currentColor', opacity: 0.1 }}
                                />
                                <Bar dataKey="reviews" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#818cf8" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-200">Top 5 Employees</h2>
                    </div>
                    <div className="space-y-3">
                        {leaderboard.length === 0 && (
                            <p className="text-zinc-500 text-sm text-center py-6">No data yet.</p>
                        )}
                        {leaderboard.map((emp, idx) => (
                            <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-zinc-200 dark:border-zinc-800/50">
                                <span className="text-lg w-8 text-center">{getRankIcon(idx + 1)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">{emp.name}</div>
                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{emp.approved_count} reviews</div>
                                </div>
                                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{emp.total_points} pts</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Reviews */}
            <div className="glass-card rounded-2xl p-6">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-200 mb-4">Recent Submissions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                                <th className="text-left py-2 pr-4 font-medium">Employee</th>
                                <th className="text-left py-2 pr-4 font-medium">Date</th>
                                <th className="text-left py-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                            {recentReviews.length === 0 && (
                                <tr><td colSpan={3} className="py-6 text-center text-zinc-500 dark:text-zinc-400">No submissions yet.</td></tr>
                            )}
                            {recentReviews.map((r: any) => (
                                <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                    <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">{r.profiles?.name ?? '—'}</td>
                                    <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="py-3"><StatusBadge status={r.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
