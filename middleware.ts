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

    const redirectWithCookies = (url: string) => {
        const response = NextResponse.redirect(new URL(url, request.url))
        supabaseResponse.cookies.getAll().forEach(c => {
            response.cookies.set(c.name, c.value, {
                domain: c.domain,
                expires: c.expires,
                httpOnly: c.httpOnly,
                maxAge: c.maxAge,
                path: c.path,
                sameSite: c.sameSite,
                secure: c.secure,
            })
        })
        return response
    }

    // Not logged in → redirect to login (except for login page itself)
    if (!user && !pathname.startsWith('/login')) {
        return redirectWithCookies('/login')
    }

    // If no user is logged in, we only reach here if on the login page (due to check above)
    if (!user) {
        return supabaseResponse
    }

    // Role-based access control and disabled check
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active, is_deleted')
        .eq('id', user.id)
        .single()

    const role = profile?.role ?? 'employee'

    // If user is deleted or inactive, block access
    // Explicitly check for true/false to handle NULLs from manual schema changes
    if (profile?.is_deleted === true || profile?.is_active === false) {
        await supabase.auth.signOut()
        const errorParam = profile?.is_deleted === true ? 'account_deleted' : 'account_disabled'
        return redirectWithCookies(`/login?error=${errorParam}`)
    }

    // Already logged in trying to access login → redirect based on role
    if (pathname === '/login') {
        const destination = role === 'admin' ? '/admin/dashboard' : '/employee/profile'
        return redirectWithCookies(destination)
    }

    // Employee trying to access admin routes
    if (pathname.startsWith('/admin') && role !== 'admin') {
        return redirectWithCookies('/employee/profile')
    }

    // Admin trying to access employee routes → redirect to admin
    if (pathname.startsWith('/employee') && role === 'admin') {
        return redirectWithCookies('/admin/dashboard')
    }

    // Root redirect
    if (pathname === '/') {
        const destination = role === 'admin' ? '/admin/dashboard' : '/employee/profile'
        return redirectWithCookies(destination)
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
