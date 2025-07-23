'use client'

import { useState } from 'react'
import ContentEditor from '@/components/ContentEditor'
import PostSettings from '@/components/PostSettings'
import dynamic from 'next/dynamic'

// 開発時とGitHub Pages静的サイト時で異なるコンポーネントを読み込み
const AuthStatus = dynamic(
  () => {
    // GitHub Pages (静的サイト) の場合
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      return import('@/components/StaticAuthStatus')
    }
    // 開発環境または他の環境の場合は静的コンポーネントを使用
    return import('@/components/StaticAuthStatus')
  },
  { ssr: false }
)

const PostingPanel = dynamic(
  () => {
    // GitHub Pages (静的サイト) の場合
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
      return import('@/components/StaticPostingPanel')
    }
    // 開発環境または他の環境の場合は静的コンポーネントを使用
    return import('@/components/StaticPostingPanel')
  },
  { ssr: false }
)

const ContentInput = dynamic(
  () => {
    // 静的エクスポート時 (GitHub Pages等) の場合
    if (process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' || 
        (typeof window !== 'undefined' && window.location.hostname.includes('github.io'))) {
      return import('@/components/StaticContentInput')
    }
    // 開発環境または他の環境の場合は通常のコンポーネントを使用
    return import('@/components/ContentInput')
  },
  { ssr: false }
)

export default function Home() {
  const [inputType, setInputType] = useState<'url' | 'text'>('text')
  const [content, setContent] = useState('')
  const [generatedContent, setGeneratedContent] = useState<{
    x: string
    instagram: string[]
    note: string
  } | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 w-full flex flex-col">
      <div className="container-centered py-8 flex-1">
        {/* Header */}
        <header className="text-center mb-8 w-full">
          <div className="flex justify-center items-center mb-4 relative">
            <div className="absolute right-0">
              <AuthStatus />
            </div>
          </div>
          <h1 className="heading-1 mb-2">生成記事自動投稿ツール</h1>
          <p className="body-text">AIを活用したSEO最適化記事生成・SNS投稿ツール</p>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          <ContentInput
            inputType={inputType}
            setInputType={setInputType}
            content={content}
            setContent={setContent}
            onGenerate={(generated) => setGeneratedContent(generated)}
          />

          {generatedContent && (
            <>
              <ContentEditor
                generatedContent={generatedContent}
                setGeneratedContent={setGeneratedContent}
                originalContent={content}
                inputType={inputType}
              />
              <PostSettings generatedContent={generatedContent} />
              <PostingPanel 
                title="生成されたコンテンツ"
                content={generatedContent.note}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="small-text">
            Powered by Gemini AI • Built with Next.js
          </p>
        </footer>
      </div>
    </div>
  )
}