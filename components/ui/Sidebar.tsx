'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard, Users, FileCheck, Gift, ShoppingBag,
    LogOut, ChevronRight, Menu, X
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { ThemeToggle } from './ThemeToggle'

const adminNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/reviews', label: 'Review Approvals', icon: FileCheck },
    { href: '/admin/rewards', label: 'Manage Rewards', icon: Gift },
    { href: '/admin/redemptions', label: 'Redemptions', icon: ShoppingBag },
]

const employeeNavItems = [
    { href: '/employee/profile', label: 'My Profile', icon: LayoutDashboard },
    { href: '/employee/submit', label: 'Submit Review', icon: FileCheck },
    { href: '/employee/leaderboard', label: 'Leaderboard', icon: Users },
    { href: '/employee/rewards', label: 'Rewards', icon: Gift },
]

interface SidebarProps {
    role: 'admin' | 'employee'
    userName: string
    userEmail: string
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const navItems = role === 'admin' ? adminNavItems : employeeNavItems

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const NavContent = () => (
        <>
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-6 border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
                </div>
                <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">ReviewRewards</div>
                    <div className="text-xs text-zinc-500 capitalize">{role} Panel</div>
                </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => setOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                                active
                                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60'
                            )}
                        >
                            <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300')} />
                            <span className="flex-1">{label}</span>
                            {active && <ChevronRight className="w-4 h-4 opacity-60" />}
                        </Link>
                    )
                })}
            </nav>

            {/* User info + Theme + Logout */}
            <div className="px-3 py-4 border-t border-zinc-300 dark:border-zinc-800 space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">{userName}</div>
                        <div className="text-xs text-zinc-500 truncate">{userEmail}</div>
                    </div>
                </div>

                <div className="px-3 py-2 flex items-center justify-between border-t border-zinc-200/50 dark:border-zinc-800/50 mt-2 pt-4">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Appearance</span>
                    <ThemeToggle />
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sign out</span>
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-zinc-100/95 dark:bg-zinc-950/95 backdrop-blur border-b border-zinc-300 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">ReviewRewards</span>
                </div>
                <button onClick={() => setOpen(!open)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1">
                    {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile overlay */}
            {open && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <div className={cn(
                'lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300',
                open ? 'translate-x-0' : '-translate-x-full'
            )}>
                <NavContent />
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:flex flex-col w-64 bg-zinc-100 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0 flex-shrink-0">
                <NavContent />
            </div>
        </>
    )
}
