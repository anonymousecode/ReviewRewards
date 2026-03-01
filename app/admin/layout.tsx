import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/ui/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('name, email, role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/employee/profile')

    return (
        <div className="flex min-h-screen bg-zinc-950">
            <Sidebar role="admin" userName={profile.name} userEmail={profile.email} />
            <main className="flex-1 min-w-0 pt-14 lg:pt-0">
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
