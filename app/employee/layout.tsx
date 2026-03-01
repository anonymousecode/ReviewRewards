import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/ui/Sidebar'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('name, email, role')
        .eq('id', user.id)
        .single()

    if (profile?.role === 'admin') redirect('/admin/dashboard')

    return (
        <div className="flex min-h-screen bg-zinc-950">
            <Sidebar role="employee" userName={profile?.name ?? 'Employee'} userEmail={profile?.email ?? ''} />
            <main className="flex-1 min-w-0 pt-14 lg:pt-0">
                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
