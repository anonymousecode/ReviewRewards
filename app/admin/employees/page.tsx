'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Users, UserPlus, ToggleLeft, ToggleRight, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState({ name: '', email: '', password: '' })
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 3500)
    }

    const loadEmployees = async () => {
        const supabase = createClient()
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'employee')
            .order('created_at', { ascending: false })
        setEmployees(data || [])
        setLoading(false)
    }

    useEffect(() => { loadEmployees() }, [])

    const toggleActive = async (emp: Profile) => {
        const supabase = createClient()
        await supabase.from('profiles').update({ is_active: !emp.is_active }).eq('id', emp.id)
        showToast('success', `${emp.name} ${emp.is_active ? 'disabled' : 'enabled'}.`)
        loadEmployees()
    }

    const addEmployee = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const supabase = createClient()
        const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { name: form.name, role: 'employee' } }
        })
        if (error) {
            showToast('error', error.message)
        } else {
            showToast('success', `Employee "${form.name}" added! They must verify their email.`)
            setModalOpen(false)
            setForm({ name: '', email: '', password: '' })
            setTimeout(loadEmployees, 1500)
        }
        setSaving(false)
    }

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-in slide-in-from-top-2 duration-300
          ${toast.type === 'success'
                        ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                        : 'bg-red-950 border-red-500/40 text-red-300'
                    }`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4" />
                        : <AlertCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Employees</h1>
                    <p className="text-zinc-400 text-sm mt-1">Manage your team</p>
                </div>
                <button
                    id="add-employee-btn"
                    onClick={() => setModalOpen(true)}
                    className="btn-gradient text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Employee
                </button>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-zinc-800">
                            <tr className="text-zinc-500">
                                <th className="text-left px-6 py-4 font-medium">Name</th>
                                <th className="text-left px-4 py-4 font-medium">Email</th>
                                <th className="text-left px-4 py-4 font-medium">Points</th>
                                <th className="text-left px-4 py-4 font-medium">Status</th>
                                <th className="text-left px-4 py-4 font-medium">Joined</th>
                                <th className="text-left px-4 py-4 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {loading && (
                                <tr><td colSpan={6} className="py-12 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                                </td></tr>
                            )}
                            {!loading && employees.length === 0 && (
                                <tr><td colSpan={6} className="py-12 text-center text-zinc-500">No employees yet.</td></tr>
                            )}
                            {employees.map(emp => (
                                <tr key={emp.id} className="hover:bg-zinc-900/40 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-medium text-zinc-200">{emp.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-zinc-400">{emp.email}</td>
                                    <td className="px-4 py-4">
                                        <span className="font-semibold text-indigo-400">{emp.total_points}</span>
                                        <span className="text-zinc-500 ml-1">pts</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge status={emp.is_active ? 'approved' : 'rejected'} />
                                    </td>
                                    <td className="px-4 py-4 text-zinc-400">{new Date(emp.created_at).toLocaleDateString()}</td>
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => toggleActive(emp)}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors
                        ${emp.is_active
                                                    ? 'text-red-400 hover:bg-red-500/10'
                                                    : 'text-emerald-400 hover:bg-emerald-500/10'
                                                }`}
                                        >
                                            {emp.is_active
                                                ? <><ToggleRight className="w-4 h-4" /> Disable</>
                                                : <><ToggleLeft className="w-4 h-4" /> Enable</>
                                            }
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Employee Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-sm">
                    <div className="glass-card rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-zinc-100">Add New Employee</h2>
                            <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={addEmployee} className="space-y-4">
                            {[
                                { label: 'Full Name', id: 'emp-name', type: 'text', key: 'name' },
                                { label: 'Email Address', id: 'emp-email', type: 'email', key: 'email' },
                                { label: 'Temporary Password', id: 'emp-password', type: 'password', key: 'password' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">{f.label}</label>
                                    <input
                                        id={f.id}
                                        type={f.type}
                                        required
                                        value={form[f.key as keyof typeof form]}
                                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-sm"
                                    />
                                </div>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 btn-gradient text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    {saving ? 'Adding…' : 'Add Employee'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
