'use client'

import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff } from 'lucide-react'

interface ContentInputProps {
  inputType: 'url' | 'text'
  setInputType: (type: 'url' | 'text') => void
  content: string
  setContent: (content: string) => void
  onGenerate: (generatedContent: { x: string; instagram: string[]; note: string; threads: string; html: string }) => void
}

export default function ContentInput({
  inputType,
  setInputType,
  content,
  setContent,
  onGenerate,
}: ContentInputProps) {
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')

  // ローカルストレージからAPIキーを読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem('gemini_api_key')
      if (savedApiKey) {
        setApiKey(savedApiKey)
      }
    }
  }, [])

  // APIキーをローカルストレージに保存
  const saveApiKey = (key: string) => {
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('gemini_api_key', key.trim())
      } else {
        localStorage.removeItem('gemini_api_key')
      }
    }
  }

  const handleApiKeyChange = (key: string) => {
    setApiKey(key)
    setApiKeyError('')
    saveApiKey(key)
  }

  const validateApiKey = (key: string): boolean => {
    if (!key || key.trim().length === 0) {
      setApiKeyError('Gemini API キーを入力してください')
      return false
    }
    if (!key.startsWith('AIza')) {
      setApiKeyError('有効なGemini API キーを入力してください（AIzaで始まる必要があります）')
      return false
    }
    if (key.length < 30) {
      setApiKeyError('API キーが短すぎます。正しいキーを入力してください')
      return false
    }
    setApiKeyError('')
    return true
  }

  const handleGenerate = async () => {
    if (!content.trim()) {
      alert('コンテンツを入力してください')
      return
    }

    if (!validateApiKey(apiKey)) {
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          inputType,
          apiKey: apiKey.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'コンテンツの生成に失敗しました')
      }

      if (result.success && result.data) {
        onGenerate(result.data)
      } else {
        throw new Error('生成されたデータが不正です')
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert(
        error instanceof Error 
          ? error.message 
          : 'コンテンツの生成中にエラーが発生しました。しばらく待ってから再度お試しください。'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="heading-3 mb-6">AI コンテンツ生成</h2>
      
      {/* API Key Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Gemini API キー
          </div>
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className={`input-field pr-12 ${apiKeyError ? 'border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {apiKeyError && (
          <p className="mt-1 text-sm text-red-600">{apiKeyError}</p>
        )}
        {!apiKey && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <a 
                href="https://ai.google.dev/gemini-api/docs/api-key" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-800 hover:underline font-medium"
              >
                Google AI Studio
              </a> でGemini API キーを取得してください。キーはブラウザに安全に保存されます。
            </p>
          </div>
        )}
      </div>
      
      {/* Input Type Toggle */}
      <div className="mb-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setInputType('url')}
            className={`tab-button flex-1 ${inputType === 'url' ? 'active' : ''}`}
          >
            URL入力
          </button>
          <button
            onClick={() => setInputType('text')}
            className={`tab-button flex-1 ${inputType === 'text' ? 'active' : ''}`}
          >
            テキスト入力
          </button>
        </div>
      </div>

      {/* Input Field */}
      <div className="mb-4">
        {inputType === 'url' ? (
          <input
            type="url"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://example.com/article"
            className="input-field"
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="記事のテキストを入力してください..."
            rows={8}
            className="input-field resize-none"
          />
        )}
      </div>

      {/* Character Count */}
      {content && (
        <div className="mb-4">
          <p className="small-text text-right">
            {content.length} 文字
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!content.trim() || loading || !apiKey.trim()}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="loading-spinner"></div>
            AI生成中...
          </>
        ) : (
          '🚀 AI生成開始'
        )}
      </button>

      {/* Help Text */}
      <div className="mt-4 space-y-3">
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="small-text text-green-700">
            ✨ このツールは高品質なX投稿、Instagram投稿、note記事を一度に生成します
          </p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="small-text text-blue-700">
            💡 より良い結果を得るために、具体的で詳細なコンテンツを入力してください
          </p>
        </div>
        {!apiKey && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="small-text text-yellow-700">
              ⚠️ AI生成を開始するにはGemini API キーが必要です
            </p>
          </div>
        )}
      </div>
    </div>
  )
}