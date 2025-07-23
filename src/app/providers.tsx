'use client'

import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  // For static export, disable session provider
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
    return <>{children}</>
  }
  
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}