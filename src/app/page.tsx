'use client'

import { useState } from 'react'
import ContentInput from '@/components/ContentInput'
import ContentEditor from '@/components/ContentEditor'
import PostSettings from '@/components/PostSettings'
import StaticAuthStatus from '@/components/StaticAuthStatus'
import StaticPostingPanel from '@/components/StaticPostingPanel'

export default function Home() {
  const [inputType, setInputType] = useState<'url' | 'text'>('url')
  const [content, setContent] = useState('')
  const [generatedContent, setGeneratedContent] = useState<{
    x: string
    instagram: string[]
    note: string
  } | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <StaticAuthStatus />
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
              <StaticPostingPanel 
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