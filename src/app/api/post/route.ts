import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TwitterService } from '@/lib/twitter'
import { InstagramService } from '@/lib/instagram'
import { NoteService } from '@/lib/note'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { platform, content, title } = await request.json()

    switch (platform) {
      case 'twitter':
        if (session.provider === 'twitter' && session.accessToken) {
          const twitterService = new TwitterService(session.accessToken)
          const result = await twitterService.postTweet(content)
          return NextResponse.json(result)
        }
        break

      case 'instagram':
        const instagramService = new InstagramService(
          process.env.INSTAGRAM_ACCESS_TOKEN!,
          process.env.INSTAGRAM_USER_ID!
        )
        const slides = content.split('\n\n').filter((slide: string) => slide.trim())
        const result = await instagramService.postCarousel(slides)
        return NextResponse.json(result)

      case 'note':
        const noteService = new NoteService(process.env.NOTE_API_KEY!)
        const noteResult = await noteService.postArticle(title, content)
        return NextResponse.json(noteResult)

      default:
        return NextResponse.json({ error: '無効なプラットフォームです' }, { status: 400 })
    }

    return NextResponse.json({ error: '投稿に失敗しました' }, { status: 500 })
  } catch (error) {
    console.error('Post API Error:', error)
    return NextResponse.json({ error: '投稿に失敗しました' }, { status: 500 })
  }
}