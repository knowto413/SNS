'use client'

import { useState } from 'react'

interface PostSettingsProps {
  generatedContent: {
    x: string
    instagram: string[]
    note: string
  }
}

export default function PostSettings({ generatedContent }: PostSettingsProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<{
    x: boolean
    instagram: boolean
    note: boolean
  }>({
    x: false,
    instagram: false,
    note: false,
  })
  const [posting, setPosting] = useState(false)

  const handlePlatformToggle = (platform: keyof typeof selectedPlatforms) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform],
    }))
  }

  const handlePost = async () => {
    const selectedCount = Object.values(selectedPlatforms).filter(Boolean).length
    if (selectedCount === 0) return

    setPosting(true)
    
    // モック投稿処理
    setTimeout(() => {
      alert('投稿が完了しました！')
      setPosting(false)
    }, 2000)
  }

  const selectedCount = Object.values(selectedPlatforms).filter(Boolean).length

  return (
    <div className="card p-6">
      <h2 className="heading-3 mb-4">投稿設定・実行</h2>
      
      {/* Platform Selection */}
      <div className="mb-6">
        <label className="body-text font-medium mb-3 block">投稿するSNSを選択</label>
        <div className="space-y-3">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedPlatforms.x}
              onChange={() => handlePlatformToggle('x')}
              className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="body-text font-medium">X (Twitter)</div>
              <div className="small-text text-gray-500">280文字のマイクロブログ</div>
            </div>
          </label>
          
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedPlatforms.instagram}
              onChange={() => handlePlatformToggle('instagram')}
              className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="body-text font-medium">Instagram</div>
              <div className="small-text text-gray-500">10枚のカルーセル投稿</div>
            </div>
          </label>
          
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={selectedPlatforms.note}
              onChange={() => handlePlatformToggle('note')}
              className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <div className="body-text font-medium">note</div>
              <div className="small-text text-gray-500">マークダウン記事</div>
            </div>
          </label>
        </div>
      </div>

      {/* Post Button */}
      <button
        onClick={handlePost}
        disabled={selectedCount === 0 || posting}
        className="btn-primary w-full"
      >
        {posting ? (
          <>
            <div className="loading-spinner"></div>
            投稿中...
          </>
        ) : selectedCount > 0 ? (
          `今すぐ投稿 (${selectedCount}個のSNS)`
        ) : (
          '投稿するSNSを選択してください'
        )}
      </button>

      {/* Status Message */}
      {selectedCount === 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="small-text text-yellow-700">
            ⚠️ 投稿するSNSプラットフォームを選択してください
          </p>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="small-text text-green-700">
            ✅ {selectedCount}個のプラットフォームに投稿する準備ができました
          </p>
        </div>
      )}
    </div>
  )
}