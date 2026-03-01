'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CheckCircle, XCircle, ExternalLink, Image as ImageIcon, Loader2, Eye, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Review } from '@/lib/types'

const TABS = ['pending', 'approved', 'rejected'] as const
type Tab = typeof TABS[number]

export default function ReviewsPage() {
    const [tab, setTab] = useState<Tab>('pending')
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 3500)
    }

    const loadReviews = async (status: Tab) => {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('reviews')
            .select('*, profiles(name, email, is_deleted)')
            .eq('status', status)
            .order('created_at', { ascending: false })

        const filtered = (data || []).filter((r: any) => !r.profiles?.is_deleted)
        setReviews(filtered as unknown as Review[])
        setLoading(false)
    }

    useEffect(() => { loadReviews(tab) }, [tab])

    const getScreenshotUrl = (url: string) => {
        const supabase = createClient()
        const { data } = supabase.storage.from('review-screenshots').getPublicUrl(url)
        return data.publicUrl
    }

    const approve = async (review: Review) => {
        setActionLoading(review.id)
        const supabase = createClient()
        const POINTS = 10
        await supabase.from('reviews').update({ status: 'approved', points_awarded: POINTS }).eq('id', review.id)
        // Increment employee points
        const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', review.employee_id).single()
        if (profile) {
            await supabase.from('profiles').update({ total_points: (profile.total_points || 0) + POINTS }).eq('id', review.employee_id)
        }
        showToast('success', 'Review approved! 10 points awarded.')
        loadReviews(tab)
        setActionLoading(null)
    }

    const reject = async () => {
        if (!rejectModal) return
        setActionLoading(rejectModal.id)
        const supabase = createClient()
        await supabase.from('reviews').update({ status: 'rejected', rejection_reason: rejectReason || null }).eq('id', rejectModal.id)
        showToast('success', 'Review rejected.')
        setRejectModal(null)
        setRejectReason('')
        loadReviews(tab)
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
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Review Approvals</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Approve or reject submitted Google reviews</p>
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

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-zinc-200 dark:border-zinc-800">
                            <tr className="text-zinc-500">
                                <th className="text-left px-6 py-4 font-medium">Employee</th>
                                <th className="text-left px-4 py-4 font-medium">Review Link</th>
                                <th className="text-left px-4 py-4 font-medium">Screenshot</th>
                                <th className="text-left px-4 py-4 font-medium">Date</th>
                                <th className="text-left px-4 py-4 font-medium">Status</th>
                                {tab === 'pending' && <th className="text-left px-4 py-4 font-medium">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                            {loading && (
                                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" /></td></tr>
                            )}
                            {!loading && reviews.length === 0 && (
                                <tr><td colSpan={6} className="py-12 text-center text-zinc-500">No {tab} reviews.</td></tr>
                            )}
                            {reviews.map((r: any) => (
                                <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900 dark:text-zinc-200">{r.profiles?.name}</div>
                                        <div className="text-xs text-zinc-500">{r.profiles?.email}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <a href={r.review_link} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors truncate max-w-[180px]">
                                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate text-xs">View Review</span>
                                        </a>
                                    </td>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => setPreviewUrl(getScreenshotUrl(r.screenshot_url))}
                                            className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors text-xs"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Preview
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={r.status} />
                                        {r.rejection_reason && (
                                            <div className="text-xs text-zinc-500 mt-1 max-w-[120px] truncate" title={r.rejection_reason}>
                                                {r.rejection_reason}
                                            </div>
                                        )}
                                    </td>
                                    {tab === 'pending' && (
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={actionLoading === r.id}
                                                    onClick={() => approve(r)}
                                                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === r.id
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        : <CheckCircle className="w-3.5 h-3.5" />}
                                                    Approve
                                                </button>
                                                <button
                                                    disabled={actionLoading === r.id}
                                                    onClick={() => setRejectModal({ id: r.id, name: r.profiles?.name })}
                                                    className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Screenshot Preview */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
                    <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPreviewUrl(null)} className="absolute -top-10 right-0 text-zinc-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                        <img src={previewUrl} alt="Review screenshot" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-zinc-700" />
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm">
                    <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Reject Review</h2>
                            <button onClick={() => setRejectModal(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4">Rejecting submission from <strong className="text-zinc-800 dark:text-zinc-200">{rejectModal.name}</strong>. Optionally add a reason:</p>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection (optional)"
                            rows={3}
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm resize-none"
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setRejectModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium">Cancel</button>
                            <button onClick={reject} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
