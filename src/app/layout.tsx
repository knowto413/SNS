import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '生成記事自動投稿ツール',
  description: 'AIを活用したSEO最適化記事生成・SNS投稿ツール',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="w-full h-full">
      <body className={`${inter.className} w-full min-h-screen`}>
        <Providers>
          <div className="w-full min-h-screen flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}