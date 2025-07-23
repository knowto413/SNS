'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Send, X, Instagram, FileText, Loader2 } from 'lucide-react'

interface PostingPanelProps {
  title: string
  content: string
}

export default function PostingPanel({ title, content }: PostingPanelProps) {
  // For static export (GitHub Pages), show disabled state first
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Send className="h-5 w-5 mr-2" />
          SNS投稿
        </h3>
        <div className="text-center p-6 text-gray-500">
          <p>SNS投稿機能は開発版でのみ利用可能です</p>
        </div>
      </div>
    )
  }
  
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: session } = useSession()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isPosting, setIsPosting] = useState(false)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [postingTo, setPostingTo] = useState<string | null>(null)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [results, setResults] = useState<{ [key: string]: any }>({})

  const postToSNS = async (platform: string) => {
    if (!content.trim()) return

    setIsPosting(true)
    setPostingTo(platform)

    try {
      const response = await fetch('/api/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform,
          content,
          title,
        }),
      })

      const result = await response.json()
      setResults(prev => ({ ...prev, [platform]: result }))
    } catch (error) {
      console.error('投稿エラー:', error)
      setResults(prev => ({ 
        ...prev, 
        [platform]: { success: false, error: '投稿に失敗しました' } 
      }))
    } finally {
      setIsPosting(false)
      setPostingTo(null)
    }
  }

  const platforms = [
    { 
      id: 'twitter', 
      name: 'X (Twitter)', 
      icon: X, 
      color: 'bg-black hover:bg-gray-800',
      available: session?.provider === 'twitter'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: Instagram, 
      color: 'bg-pink-600 hover:bg-pink-700',
      available: true
    },
    { 
      id: 'note', 
      name: 'note', 
      icon: FileText, 
      color: 'bg-green-600 hover:bg-green-700',
      available: true
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Send className="h-5 w-5 mr-2" />
        SNS投稿
      </h3>

      {!session && (
        <div className="text-center p-6 text-gray-500">
          <p>SNSに投稿するには認証が必要です</p>
        </div>
      )}

      {session && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon
              const result = results[platform.id]
              const isCurrentlyPosting = isPosting && postingTo === platform.id

              return (
                <div key={platform.id} className="space-y-2">
                  <button
                    onClick={() => postToSNS(platform.id)}
                    disabled={isPosting || !platform.available}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${platform.color}`}
                  >
                    {isCurrentlyPosting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span>{platform.name}</span>
                  </button>

                  {result && (
                    <div className={`text-xs p-2 rounded ${
                      result.success 
                        ? 'bg-green-50 text-green-800' 
                        : 'bg-red-50 text-red-800'
                    }`}>
                      {result.success ? '投稿成功' : `エラー: ${result.error}`}
                    </div>
                  )}

                  {!platform.available && platform.id === 'twitter' && (
                    <div className="text-xs text-gray-500 text-center">
                      Xでログインが必要
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="text-xs text-gray-500 mt-4">
            <p>• X: @knowto413 にツイート投稿</p>
            <p>• Instagram: knowtomoney にカルーセル投稿</p>
            <p>• note: https://note.com/knowto413 に記事投稿</p>
          </div>
        </div>
      )}
    </div>
  )
}