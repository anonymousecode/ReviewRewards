'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

export function SessionTimeout() {
    const router = useRouter()
    const supabase = createClient()
    const lastActivity = useRef<number>(Date.now())
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const handleSignOut = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            await supabase.auth.signOut()
            router.push('/login?error=session_expired')
            router.refresh()
        }
    }, [supabase, router])

    const resetTimer = useCallback(() => {
        lastActivity.current = Date.now()
    }, [])

    useEffect(() => {
        // Events that count as activity
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']

        const updateActivity = () => resetTimer()

        events.forEach(event => {
            window.addEventListener(event, updateActivity)
        })

        // Check for inactivity every 30 seconds
        const intervalId = setInterval(() => {
            const now = Date.now()
            if (now - lastActivity.current >= TIMEOUT_MS) {
                handleSignOut()
            }
        }, 30000)

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity)
            })
            clearInterval(intervalId)
        }
    }, [resetTimer, handleSignOut])

    return null
}
