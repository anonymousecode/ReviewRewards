'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRankIcon, startOfMonth, endOfMonth, getMonthName } from '@/lib/utils'
import { Trophy, Loader2 } from 'lucide-react'

interface LeaderboardEntry {
    id: string
    name: string
    total_points: number
    review_count: number
    is_me: boolean
}

type LeaderboardType = 'monthly' | 'alltime'

export default function LeaderboardPage() {
    const [type, setType] = useState<LeaderboardType>('monthly')
    const [data, setData] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [myId, setMyId] = useState<string>('')

    const load = async (t: LeaderboardType) => {
        setLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setMyId(user.id)

        // Get all employees
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, total_points')
            .eq('role', 'employee')
            .eq('is_active', true)

        // Get approved reviews for this period
        let query = supabase.from('reviews').select('employee_id').eq('status', 'approved')
        if (t === 'monthly') {
            const now = new Date()
            query = query.gte('created_at', startOfMonth(now)).lte('created_at', endOfMonth(now))
        }
        const { data: reviews } = await query

        const countMap: Record<string, number> = {}
        reviews?.forEach((r: any) => {
            countMap[r.employee_id] = (countMap[r.employee_id] || 0) + 1
        })

        const entries: LeaderboardEntry[] = (profiles || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            total_points: p.total_points,
            review_count: countMap[p.id] || 0,
            is_me: p.id === user.id,
        }))

        // Sort by review count for monthly, total points for all-time
        entries.sort((a, b) =>
            t === 'monthly' ? b.review_count - a.review_count : b.total_points - a.total_points
        )

        setData(entries)
        setLoading(false)
    }

    useEffect(() => { load(type) }, [type])

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Leaderboard</h1>
                    <p className="text-zinc-400 text-sm">{type === 'monthly' ? getMonthName(new Date()) : 'All Time'}</p>
                </div>
            </div>

            {/* Toggle */}
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl w-fit">
                {(['monthly', 'alltime'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${type === t ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                        {t === 'monthly' ? 'Monthly' : 'All Time'}
                    </button>
                ))}
            </div>

            {/* Podium for top 3 */}
            {!loading && data.length >= 3 && (
                <div className="flex items-end justify-center gap-4 py-6">
                    {/* 2nd */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-500 flex items-center justify-center text-xl font-bold text-white shadow">
                            {data[1].name.charAt(0)}
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-medium text-zinc-300 max-w-[80px] truncate">{data[1].name}</div>
                            <div className="text-xs text-zinc-500">{type === 'monthly' ? `${data[1].review_count} reviews` : `${data[1].total_points} pts`}</div>
                        </div>
                        <div className="w-20 h-20 bg-zinc-700 rounded-t-xl flex items-end justify-center pb-2">
                            <span className="text-2xl">🥈</span>
                        </div>
                    </div>
                    {/* 1st */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-amber-500/40">
                            {data[0].name.charAt(0)}
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-semibold text-zinc-100 max-w-[100px] truncate">{data[0].name}</div>
                            <div className="text-xs text-zinc-400">{type === 'monthly' ? `${data[0].review_count} reviews` : `${data[0].total_points} pts`}</div>
                        </div>
                        <div className="w-20 h-28 bg-gradient-to-b from-amber-500/30 to-amber-600/20 border border-amber-500/30 rounded-t-xl flex items-end justify-center pb-2">
                            <span className="text-2xl">🥇</span>
                        </div>
                    </div>
                    {/* 3rd */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-700 to-orange-600 flex items-center justify-center text-lg font-bold text-white shadow">
                            {data[2].name.charAt(0)}
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-medium text-zinc-300 max-w-[80px] truncate">{data[2].name}</div>
                            <div className="text-xs text-zinc-500">{type === 'monthly' ? `${data[2].review_count} reviews` : `${data[2].total_points} pts`}</div>
                        </div>
                        <div className="w-20 h-14 bg-zinc-700 rounded-t-xl flex items-end justify-center pb-2">
                            <span className="text-2xl">🥉</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Full list */}
            <div className="glass-card rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {data.length === 0 && (
                            <div className="py-12 text-center text-zinc-500">No data yet.</div>
                        )}
                        {data.map((entry, idx) => (
                            <div
                                key={entry.id}
                                className={`flex items-center gap-4 px-5 py-4 transition-colors
                  ${entry.is_me ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500' : 'hover:bg-zinc-900/40'}`}
                            >
                                <span className="text-lg w-10 text-center flex-shrink-0">{getRankIcon(idx + 1)}</span>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                    {entry.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium truncate ${entry.is_me ? 'text-indigo-300' : 'text-zinc-200'}`}>
                                        {entry.name} {entry.is_me && <span className="text-xs text-indigo-400 ml-1">(You)</span>}
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                        {type === 'monthly' ? `${entry.review_count} reviews this month` : `${entry.review_count} reviews total`}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-indigo-400">
                                        {type === 'monthly' ? entry.review_count : entry.total_points}
                                    </div>
                                    <div className="text-xs text-zinc-500">{type === 'monthly' ? 'reviews' : 'pts'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
