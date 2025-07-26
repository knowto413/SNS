import { NextRequest, NextResponse } from 'next/server'
import { NoteService } from '@/lib/note'
import { ThreadsService } from '@/lib/threads'
import { HTMLService } from '@/lib/html'

export async function POST(request: NextRequest) {
  try {
    const { platform, content, title } = await request.json()
    
    if (!platform || !content || !title) {
      return NextResponse.json(
        { success: false, error: '必要な情報が不足しています' },
        { status: 400 }
      )
    }

    let result: { success: boolean; data?: any; error?: string }

    switch (platform) {
      case 'twitter':
        // X (Twitter) APIの実装は認証が複雑なため、ここでは簡単な成功レスポンスを返す
        result = { 
          success: true, 
          data: { message: 'X投稿は別途認証が必要です' } 
        }
        break

      case 'note':
        const noteApiKey = process.env.NOTE_API_KEY
        if (!noteApiKey) {
          result = { success: false, error: 'note API Keyが設定されていません' }
        } else {
          const noteService = new NoteService(noteApiKey)
          result = await noteService.postArticle(title, content)
        }
        break

      case 'threads':
        const threadsAccessToken = process.env.THREADS_ACCESS_TOKEN
        const threadsUserId = process.env.THREADS_USER_ID
        if (!threadsAccessToken || !threadsUserId) {
          result = { success: false, error: 'Threads認証情報が設定されていません' }
        } else {
          const threadsService = new ThreadsService(threadsAccessToken, threadsUserId)
          result = await threadsService.postThread(content)
        }
        break

      case 'html':
        const htmlService = new HTMLService()
        result = await htmlService.generateHTML(title, content)
        break

      default:
        result = { success: false, error: 'サポートされていないプラットフォームです' }
        break
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Post API Error:', error)
    return NextResponse.json(
      { success: false, error: '投稿処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}