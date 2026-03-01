'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Link2, Upload, Send, AlertCircle, CheckCircle2, Loader2, FileImage, X } from 'lucide-react'
import type { Review } from '@/lib/types'

export default function SubmitReviewPage() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ link: '' })
    const [file, setFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const fileRef = useRef<HTMLInputElement>(null)

    const loadReviews = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
            .from('reviews').select('*').eq('employee_id', user.id).order('created_at', { ascending: false })
        setReviews((data || []) as Review[])
        setLoading(false)
    }

    useEffect(() => { loadReviews() }, [])

    const isValidUrl = (url: string) => {
        try { new URL(url); return true } catch { return false }
    }

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!isValidUrl(form.link)) { setError('Please enter a valid URL.'); return }
        if (!file) { setError('Please upload a screenshot.'); return }
        if (file.size > 5 * 1024 * 1024) { setError('Screenshot must be under 5MB.'); return }
        if (!file.type.startsWith('image/')) { setError('Only image files are allowed.'); return }

        setSubmitting(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setError('Not authenticated.'); setSubmitting(false); return }

        // Check for duplicate review link
        const { data: existing } = await supabase
            .from('reviews').select('id').eq('review_link', form.link).eq('employee_id', user.id)
        if (existing && existing.length > 0) {
            setError('You have already submitted this review link.')
            setSubmitting(false)
            return
        }

        // Upload screenshot to storage
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('review-screenshots').upload(path, file)
        if (uploadErr) { setError(`Upload failed: ${uploadErr.message}`); setSubmitting(false); return }

        // Insert review record
        const { error: insertErr } = await supabase.from('reviews').insert({
            employee_id: user.id,
            review_link: form.link,
            screenshot_url: path,
        })
        if (insertErr) { setError(insertErr.message); setSubmitting(false); return }

        setSuccess('Review submitted successfully! Awaiting admin approval.')
        setForm({ link: '' })
        setFile(null)
        if (fileRef.current) fileRef.current.value = ''
        loadReviews()
        setSubmitting(false)
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Submit Google Review</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Share the review link and screenshot proof</p>
            </div>

            {/* Form */}
            <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-5">
                {error && (
                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-600 dark:text-emerald-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Review Link */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Google Review Link</label>
                    <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            id="review-link"
                            type="url"
                            required
                            value={form.link}
                            onChange={e => setForm({ link: e.target.value })}
                            placeholder="https://maps.google.com/..."
                            className="w-full bg-white dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-colors"
                        />
                    </div>
                </div>

                {/* Screenshot Upload */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Screenshot Proof</label>
                    <div
                        onClick={() => fileRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all
              ${file ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'}`}
                    >
                        {file ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <FileImage className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{file.name}</span>
                                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                                        className="text-zinc-500 hover:text-red-500 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <span className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-zinc-400" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Click to upload screenshot</p>
                                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP — max 5MB</p>
                                </div>
                            </>
                        )}
                        <input
                            ref={fileRef}
                            id="screenshot-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => setFile(e.target.files?.[0] ?? null)}
                        />
                    </div>
                </div>

                <button
                    id="submit-review-btn"
                    type="submit"
                    disabled={submitting}
                    className="w-full btn-gradient text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Review</>}
                </button>
            </form>

            {/* My Submissions */}
            <div className="glass-card rounded-2xl p-6">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-200 mb-4">My Submissions</h2>
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
                            {loading && <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-400 mx-auto" /></td></tr>}
                            {!loading && reviews.length === 0 && (
                                <tr><td colSpan={4} className="py-8 text-center text-zinc-400">No submissions yet.</td></tr>
                            )}
                            {reviews.map(r => (
                                <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                                    <td className="py-3 pr-4 text-zinc-500 dark:text-zinc-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                    <td className="py-3 pr-4"><StatusBadge status={r.status} /></td>
                                    <td className="py-3 pr-4 font-semibold text-indigo-600 dark:text-indigo-400">
                                        {r.status === 'approved' ? `+${r.points_awarded}` : '—'}
                                    </td>
                                    <td className="py-3 text-zinc-500 text-xs max-w-[150px] truncate">{r.rejection_reason ?? ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
