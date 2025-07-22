'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { User, LogOut, LogIn } from 'lucide-react'

export default function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
        <span>認証状態を確認中...</span>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span className="text-sm font-medium">
            {session.user?.name || 'ユーザー'}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {session.provider === 'twitter' ? 'X' : session.provider}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>ログアウト</span>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => signIn('twitter')}
      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <LogIn className="h-4 w-4" />
      <span>Xでログイン</span>
    </button>
  )
}