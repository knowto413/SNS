'use client'

export default function Providers({ children }: { children: React.ReactNode }) {
  // Always use static approach for now since we don't need auth
  return <>{children}</>
}