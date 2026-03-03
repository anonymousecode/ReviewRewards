'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Wait until mounted on client to avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="p-2 w-9 h-9" />
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl transition-all duration-200 
                bg-zinc-100 dark:bg-zinc-900 
                text-zinc-600 dark:text-zinc-400 
                hover:text-amber-500 dark:hover:text-amber-400 
                hover:bg-amber-500/10 dark:hover:bg-amber-400/10"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 animate-in zoom-in-0 duration-300" />
            ) : (
                <Moon className="w-5 h-5 animate-in zoom-in-0 duration-300" />
            )}
        </button>
    )
}
