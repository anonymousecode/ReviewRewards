import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // Not logged in → redirect to login (except for login page itself)
    if (!user && !pathname.startsWith('/login')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Already logged in trying to access login → redirect based on role
    if (user && pathname === '/login') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role ?? 'employee'
        const destination = role === 'admin' ? '/admin/dashboard' : '/employee/profile'
        return NextResponse.redirect(new URL(destination, request.url))
    }

    // Role-based access control
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role ?? 'employee'

        // Employee trying to access admin routes
        if (pathname.startsWith('/admin') && role !== 'admin') {
            return NextResponse.redirect(new URL('/employee/profile', request.url))
        }

        // Admin trying to access employee routes → redirect to admin
        if (pathname.startsWith('/employee') && role === 'admin') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url))
        }

        // Root redirect
        if (pathname === '/') {
            const destination = role === 'admin' ? '/admin/dashboard' : '/employee/profile'
            return NextResponse.redirect(new URL(destination, request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
