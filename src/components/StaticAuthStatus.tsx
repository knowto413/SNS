'use client'

import { LogIn } from 'lucide-react'

export default function StaticAuthStatus() {
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-400">
      <LogIn className="h-4 w-4" />
      <span>認証機能（開発版のみ）</span>
    </div>
  )
}