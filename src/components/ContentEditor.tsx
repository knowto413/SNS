'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Play, Pause } from 'lucide-react'

interface ContentEditorProps {
  generatedContent: {
    x: string
    instagram: string[]
    note: string
  }
  setGeneratedContent: (content: { x: string; instagram: string[]; note: string }) => void
  originalContent: string
  inputType: 'url' | 'text'
}

export default function ContentEditor({ generatedContent, setGeneratedContent, originalContent, inputType }: ContentEditorProps) {
  const [activeTab, setActiveTab] = useState<'x' | 'instagram' | 'note'>('x')
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true) // 初期状態で自動切り替えを有効
  const [autoSwitchInterval, setAutoSwitchInterval] = useState<NodeJS.Timeout | null>(null)

  const tabs = ['x', 'instagram', 'note'] as const

  // 自動切り替え機能
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setActiveTab(current => {
          const currentIndex = tabs.indexOf(current)
          return tabs[(currentIndex + 1) % tabs.length]
        })
      }, 5000) // 5秒ごとに切り替え

      setAutoSwitchInterval(interval)
      return () => clearInterval(interval)
    } else {
      if (autoSwitchInterval) {
        clearInterval(autoSwitchInterval)
        setAutoSwitchInterval(null)
      }
    }
  }, [isAutoPlaying])

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      if (autoSwitchInterval) {
        clearInterval(autoSwitchInterval)
      }
    }
  }, [autoSwitchInterval])

  const handleTabClick = (tab: 'x' | 'instagram' | 'note') => {
    setActiveTab(tab)
    // 手動でタブを切り替えた場合は自動再生を一時停止
    if (isAutoPlaying) {
      setIsAutoPlaying(false)
    }
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  const handleContentChange = (platform: 'x' | 'instagram' | 'note', value: string | string[]) => {
    setGeneratedContent({
      ...generatedContent,
      [platform]: value,
    })
  }

  const regenerateContent = async (platform: 'x' | 'instagram' | 'note') => {
    // APIキーをローカルストレージから取得
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null
    
    if (!apiKey) {
      alert('Gemini API キーが設定されていません。コンテンツ入力欄でAPIキーを設定してください。')
      return
    }

    setIsRegenerating(platform)
    
    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: originalContent,
          platform,
          inputType,
          apiKey,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || '再生成に失敗しました')
      }

      const result = await response.json()
      
      if (result.success) {
        setGeneratedContent({
          ...generatedContent,
          [platform]: result.data,
        })
      }
    } catch (error) {
      console.error('再生成エラー:', error)
      alert(error instanceof Error ? error.message : '再生成に失敗しました。もう一度お試しください。')
    } finally {
      setIsRegenerating(null)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="heading-3">コンテンツ編集・プレビュー</h2>
        <button
          onClick={toggleAutoPlay}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isAutoPlaying 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isAutoPlaying ? '自動切替中' : '自動切替'}
        </button>
      </div>
      
      {/* Platform Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg relative">
          {/* Progress bar for auto-switching */}
          {isAutoPlaying && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-full transition-all duration-[5000ms] ease-linear"
              style={{ 
                width: '33.33%', 
                transform: `translateX(${tabs.indexOf(activeTab) * 300}%)` 
              }}
            />
          )}
          <button
            onClick={() => handleTabClick('x')}
            className={`tab-button flex-1 ${activeTab === 'x' ? 'active' : ''}`}
          >
            X (Twitter)
          </button>
          <button
            onClick={() => handleTabClick('instagram')}
            className={`tab-button flex-1 ${activeTab === 'instagram' ? 'active' : ''}`}
          >
            Instagram
          </button>
          <button
            onClick={() => handleTabClick('note')}
            className={`tab-button flex-1 ${activeTab === 'note' ? 'active' : ''}`}
          >
            note
          </button>
        </div>
        <div className="mt-2 text-center">
          {isAutoPlaying ? (
            <p className="small-text text-blue-600">
              🔄 5秒ごとに自動切り替え中（手動切り替えで一時停止）
            </p>
          ) : (
            <p className="small-text text-gray-500">
              📱 自動切り替えをオンにすると、スクロール不要で全てのコンテンツを確認できます
            </p>
          )}
        </div>
      </div>

      {/* Content Editor */}
      <div>
        {activeTab === 'x' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="body-text font-medium">X投稿内容</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => regenerateContent('x')}
                  disabled={isRegenerating === 'x'}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3 w-3 ${isRegenerating === 'x' ? 'animate-spin' : ''}`} />
                  再生成
                </button>
                <span className={`small-text ${
                  generatedContent.x.length > 260 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {generatedContent.x.length}/280
                </span>
              </div>
            </div>
            <textarea
              value={generatedContent.x}
              onChange={(e) => handleContentChange('x', e.target.value)}
              maxLength={280}
              rows={4}
              className="input-field resize-none"
              placeholder="X用の投稿内容..."
            />
          </div>
        )}

        {activeTab === 'instagram' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <label className="body-text font-medium">Instagram カルーセル投稿</label>
                <p className="small-text text-gray-500">10枚のスライドで構成</p>
              </div>
              <button
                onClick={() => regenerateContent('instagram')}
                disabled={isRegenerating === 'instagram'}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3 w-3 ${isRegenerating === 'instagram' ? 'animate-spin' : ''}`} />
                再生成
              </button>
            </div>
            <div className="space-y-4">
              {generatedContent.instagram.map((slide, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="body-text font-medium">スライド {index + 1}</label>
                    <span className="small-text text-gray-500">{slide.length} 文字</span>
                  </div>
                  <textarea
                    value={slide}
                    onChange={(e) => {
                      const newSlides = [...generatedContent.instagram]
                      newSlides[index] = e.target.value
                      handleContentChange('instagram', newSlides)
                    }}
                    rows={3}
                    className="input-field resize-none"
                    placeholder={`スライド ${index + 1} の内容...`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'note' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="body-text font-medium">note記事内容</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => regenerateContent('note')}
                  disabled={isRegenerating === 'note'}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3 w-3 ${isRegenerating === 'note' ? 'animate-spin' : ''}`} />
                  再生成
                </button>
                <span className="small-text text-gray-500">Markdown形式</span>
              </div>
            </div>
            <textarea
              value={generatedContent.note}
              onChange={(e) => handleContentChange('note', e.target.value)}
              rows={12}
              className="input-field resize-none font-mono text-sm"
              placeholder="# タイトル

## 見出し

本文内容...

- リスト項目1
- リスト項目2"
            />
            <div className="mt-2 p-3 bg-green-50 rounded-lg">
              <p className="small-text text-green-700">
                ℹ️ Markdown記法（# 見出し、**太字**、- リストなど）が使用できます
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}