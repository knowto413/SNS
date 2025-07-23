'use client'

import { Send } from 'lucide-react'

interface StaticPostingPanelProps {
  title: string
  content: string
}

export default function StaticPostingPanel({ title, content }: StaticPostingPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Send className="h-5 w-5 mr-2" />
        SNS投稿
      </h3>
      <div className="text-center p-6 text-gray-500">
        <p>SNS投稿機能は開発版でのみ利用可能です</p>
        <p className="text-xs mt-2">GitHub Pages では静的サイトのため、この機能は無効化されています</p>
      </div>
    </div>
  )
}