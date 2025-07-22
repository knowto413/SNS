'use client'

import { useState } from 'react'

interface ContentInputProps {
  inputType: 'url' | 'text'
  setInputType: (type: 'url' | 'text') => void
  content: string
  setContent: (content: string) => void
  onGenerate: (generatedContent: { x: string; instagram: string[]; note: string }) => void
}

export default function ContentInput({
  inputType,
  setInputType,
  content,
  setContent,
  onGenerate,
}: ContentInputProps) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!content.trim()) return

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
      <h2 className="heading-3 mb-4">コンテンツ入力</h2>
      
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
        disabled={!content.trim() || loading}
        className="btn-primary w-full"
      >
        {loading ? (
          <>
            <div className="loading-spinner"></div>
            生成中...
          </>
        ) : (
          'AI生成開始'
        )}
      </button>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="small-text text-blue-700">
          💡 より良い結果を得るために、具体的で詳細なコンテンツを入力してください。
        </p>
      </div>
    </div>
  )
}