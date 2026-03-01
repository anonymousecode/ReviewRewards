'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gift, Plus, Loader2, X, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Reward } from '@/lib/types'

export default function RewardsPage() {
    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState({ title: '', description: '', points_required: '' })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 3500)
    }

    const load = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase.from('rewards').select('*').order('created_at', { ascending: false })
        setRewards(data || [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    const toggle = async (reward: Reward) => {
        const supabase = createClient()
        await supabase.from('rewards').update({ is_active: !reward.is_active }).eq('id', reward.id)
        showToast('success', `"${reward.title}" ${reward.is_active ? 'disabled' : 'enabled'}.`)
        load()
    }

    const create = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title || !form.points_required) return
        setSaving(true)
        const supabase = createClient()
        const { error } = await supabase.from('rewards').insert({
            title: form.title,
            description: form.description || null,
            points_required: parseInt(form.points_required),
        })
        if (error) {
            showToast('error', error.message)
        } else {
            showToast('success', `Reward "${form.title}" created!`)
            setModalOpen(false)
            setForm({ title: '', description: '', points_required: '' })
            load()
        }
        setSaving(false)
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

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Manage Rewards</h1>
                    <p className="text-zinc-400 text-sm mt-1">Create and configure reward catalog</p>
                </div>
                <button
                    id="create-reward-btn"
                    onClick={() => setModalOpen(true)}
                    className="btn-gradient text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Create Reward
                </button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading && [...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 bg-zinc-800/60 rounded-2xl animate-pulse" />
                ))}
                {!loading && rewards.length === 0 && (
                    <div className="col-span-3 text-center py-16 text-zinc-500">
                        <Gift className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No rewards yet. Create your first reward!</p>
                    </div>
                )}
                {rewards.map(r => (
                    <div key={r.id} className={`glass-card rounded-2xl p-5 flex flex-col gap-4 transition-all ${!r.is_active ? 'opacity-50' : ''}`}>
                        <div className="flex items-start justify-between">
                            <div className="p-2.5 rounded-xl bg-indigo-500/15">
                                <Gift className="w-5 h-5 text-indigo-400" />
                            </div>
                            <button
                                onClick={() => toggle(r)}
                                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors
                  ${r.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                            >
                                {r.is_active ? <><ToggleRight className="w-4 h-4" /> Disable</> : <><ToggleLeft className="w-4 h-4" /> Enable</>}
                            </button>
                        </div>
                        <div>
                            <h3 className="font-semibold text-zinc-100">{r.title}</h3>
                            {r.description && <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{r.description}</p>}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                            <span className="text-xs text-zinc-500">Points required</span>
                            <span className="text-lg font-bold text-indigo-400">{r.points_required}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm">
                    <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-zinc-100">Create Reward</h2>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={create} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Reward Title</label>
                                <input
                                    type="text" required
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. ₹100 Gift Voucher"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description (optional)</label>
                                <textarea
                                    rows={2}
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Brief description of the reward"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Points Required</label>
                                <input
                                    type="number" required min="1"
                                    value={form.points_required}
                                    onChange={e => setForm(p => ({ ...p, points_required: e.target.value }))}
                                    placeholder="e.g. 50"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 btn-gradient text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                                    {saving ? 'Creating…' : 'Create Reward'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
