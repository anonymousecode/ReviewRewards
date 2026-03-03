'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CheckCircle, Package, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Redemption } from '@/lib/types'

const TABS = ['pending', 'approved', 'delivered'] as const
type Tab = typeof TABS[number]

export default function RedemptionsPage() {
    const [tab, setTab] = useState<Tab>('pending')
    const [redemptions, setRedemptions] = useState<Redemption[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 3500)
    }

    const load = async (status: Tab) => {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('redemptions')
            .select('*, profiles(name, email, total_points, is_deleted), rewards(title, points_required)')
            .eq('status', status)
            .order('created_at', { ascending: false })

        const filtered = (data || []).filter((r: any) => !r.profiles?.is_deleted)
        setRedemptions(filtered as unknown as Redemption[])
        setLoading(false)
    }

    useEffect(() => { load(tab) }, [tab])

    const approve = async (r: any) => {
        setActionLoading(r.id)
        const supabase = createClient()
        const currentPoints: number = r.profiles?.total_points ?? 0
        const cost: number = r.rewards?.points_required ?? 0

        if (currentPoints < cost) {
            showToast('error', 'Employee has insufficient points.')
            setActionLoading(null)
            return
        }

        await supabase.from('redemptions').update({ status: 'approved' }).eq('id', r.id)
        await supabase.from('profiles').update({ total_points: currentPoints - cost }).eq('id', r.employee_id)
        showToast('success', `Redemption approved. ${cost} points deducted.`)
        load(tab)
        setActionLoading(null)
    }

    const markDelivered = async (id: string) => {
        setActionLoading(id)
        const supabase = createClient()
        await supabase.from('redemptions').update({ status: 'delivered' }).eq('id', id)
        showToast('success', 'Marked as delivered!')
        load(tab)
        setActionLoading(null)
    }

    return (
        <div className="space-y-6">
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300' : 'bg-red-950 border-red-500/40 text-red-300'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Redemptions</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Approve reward redemption requests</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl w-fit border border-zinc-200 dark:border-zinc-800">
                {TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all
              ${tab === t ? 'bg-indigo-600 text-white shadow' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-zinc-200 dark:border-zinc-800">
                            <tr className="text-zinc-500">
                                <th className="text-left px-6 py-4 font-medium">Employee</th>
                                <th className="text-left px-4 py-4 font-medium">Reward</th>
                                <th className="text-left px-4 py-4 font-medium">Points Cost</th>
                                <th className="text-left px-4 py-4 font-medium">Date</th>
                                <th className="text-left px-4 py-4 font-medium">Status</th>
                                {(tab === 'pending' || tab === 'approved') && <th className="text-left px-4 py-4 font-medium">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                            {loading && <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" /></td></tr>}
                            {!loading && redemptions.length === 0 && (
                                <tr><td colSpan={6} className="py-12 text-center text-zinc-500">No {tab} redemptions.</td></tr>
                            )}
                            {(redemptions as any[]).map(r => (
                                <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900 dark:text-zinc-200">{r.profiles?.name}</div>
                                        <div className="text-xs text-zinc-500">{r.profiles?.total_points ?? 0} pts remaining</div>
                                    </td>
                                    <td className="px-4 py-4 text-zinc-700 dark:text-zinc-300">{r.rewards?.title}</td>
                                    <td className="px-4 py-4">
                                        <span className="font-semibold text-amber-600 dark:text-amber-400">{r.rewards?.points_required}</span>
                                        <span className="text-zinc-500 ml-1">pts</span>
                                    </td>
                                    <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                                    {tab === 'pending' && (
                                        <td className="px-4 py-4">
                                            <button
                                                disabled={actionLoading === r.id}
                                                onClick={() => approve(r)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                                                Approve
                                            </button>
                                        </td>
                                    )}
                                    {tab === 'approved' && (
                                        <td className="px-4 py-4">
                                            <button
                                                disabled={actionLoading === r.id}
                                                onClick={() => markDelivered(r.id)}
                                                className="flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {actionLoading === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
                                                Mark Delivered
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
