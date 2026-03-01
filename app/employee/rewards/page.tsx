'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Gift, ShoppingBag, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import type { Reward, Redemption } from '@/lib/types'

export default function EmployeeRewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [redemptions, setRedemptions] = useState<Redemption[]>([])
    const [myPoints, setMyPoints] = useState(0)
    const [loading, setLoading] = useState(true)
    const [redeeming, setRedeeming] = useState<string | null>(null)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 3500)
    }

    const load = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const [{ data: rewardsData }, { data: profile }, { data: redemptionsData }] = await Promise.all([
            supabase.from('rewards').select('*').eq('is_active', true).order('points_required'),
            supabase.from('profiles').select('total_points').eq('id', user.id).single(),
            supabase.from('redemptions')
                .select('*, rewards(title, points_required)')
                .eq('employee_id', user.id)
                .order('created_at', { ascending: false }),
        ])

        setRewards(rewardsData || [])
        setMyPoints(profile?.total_points ?? 0)
        setRedemptions((redemptionsData || []) as unknown as Redemption[])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const redeem = async (reward: Reward) => {
        if (myPoints < reward.points_required) {
            showToast('error', `You need ${reward.points_required - myPoints} more points.`)
            return
        }

        setRedeeming(reward.id)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setRedeeming(null); return }

        // Check if there's already a pending redemption for this reward
        const { data: existing } = await supabase
            .from('redemptions')
            .select('id')
            .eq('employee_id', user.id)
            .eq('reward_id', reward.id)
            .eq('status', 'pending')

        if (existing && existing.length > 0) {
            showToast('error', 'You already have a pending redemption for this reward.')
            setRedeeming(null)
            return
        }

        const { error } = await supabase.from('redemptions').insert({
            employee_id: user.id,
            reward_id: reward.id,
        })

        if (error) {
            showToast('error', error.message)
        } else {
            showToast('success', `"${reward.title}" redemption requested! Awaiting admin approval.`)
            load()
        }
        setRedeeming(null)
    }

    return (
        <div className="space-y-8">
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' : 'bg-red-950 border-red-500/40 text-red-300'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Rewards</h1>
                    <p className="text-zinc-400 text-sm mt-1">Redeem your points for exciting rewards</p>
                </div>
                <div className="glass-card rounded-2xl px-5 py-3 flex items-center gap-3">
                    <ShoppingBag className="w-5 h-5 text-indigo-400" />
                    <div>
                        <div className="text-xs text-zinc-500">Your Balance</div>
                        <div className="font-bold text-xl text-indigo-400">{myPoints} <span className="text-sm text-zinc-400 font-normal">pts</span></div>
                    </div>
                </div>
            </div>

            {/* Available Rewards */}
            <div>
                <h2 className="text-base font-semibold text-zinc-200 mb-4">Available Rewards</h2>
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-zinc-800/60 rounded-2xl animate-pulse" />)}
                    </div>
                ) : rewards.length === 0 ? (
                    <div className="glass-card rounded-2xl py-16 text-center text-zinc-500">
                        <Gift className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No rewards available yet.</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rewards.map(r => {
                            const canAfford = myPoints >= r.points_required
                            return (
                                <div key={r.id} className={`glass-card rounded-2xl p-5 flex flex-col gap-4 transition-all hover:border-zinc-600/50 ${!canAfford ? 'opacity-60' : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="p-2.5 rounded-xl bg-indigo-500/15">
                                            <Gift className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        {!canAfford && (
                                            <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                <Lock className="w-3 h-3" />
                                                Need {r.points_required - myPoints} more
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-zinc-100">{r.title}</h3>
                                        {r.description && <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{r.description}</p>}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                                        <span className="text-lg font-bold text-indigo-400">{r.points_required} pts</span>
                                        <button
                                            disabled={!canAfford || redeeming === r.id}
                                            onClick={() => redeem(r)}
                                            className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-2
                        ${canAfford
                                                    ? 'btn-gradient text-white'
                                                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                                } disabled:opacity-60`}
                                        >
                                            {redeeming === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                                            Redeem
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Redemption History */}
            <div className="glass-card rounded-2xl p-6">
                <h2 className="text-base font-semibold text-zinc-200 mb-4">Redemption History</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-zinc-500 border-b border-zinc-800">
                                <th className="text-left py-2 pr-4 font-medium">Reward</th>
                                <th className="text-left py-2 pr-4 font-medium">Points</th>
                                <th className="text-left py-2 pr-4 font-medium">Date</th>
                                <th className="text-left py-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {!loading && redemptions.length === 0 && (
                                <tr><td colSpan={4} className="py-8 text-center text-zinc-500">No redemptions yet.</td></tr>
                            )}
                            {(redemptions as any[]).map(r => (
                                <tr key={r.id} className="hover:bg-zinc-900/40 transition-colors">
                                    <td className="py-3 pr-4 text-zinc-300">{r.rewards?.title}</td>
                                    <td className="py-3 pr-4 font-semibold text-amber-400">-{r.rewards?.points_required}</td>
                                    <td className="py-3 pr-4 text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
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
