import { NextRequest, NextResponse } from 'next/server'
import { generateSinglePlatformContent, extractContentFromUrl } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { content, platform, inputType } = await request.json()

    if (!content || !platform) {
      return NextResponse.json(
        { error: 'コンテンツまたはプラットフォームが指定されていません' },
        { status: 400 }
      )
    }

    if (!['x', 'instagram', 'note'].includes(platform)) {
      return NextResponse.json(
        { error: '無効なプラットフォームです' },
        { status: 400 }
      )
    }

    let processedContent = content

    // URL入力の場合はコンテンツを抽出
    if (inputType === 'url') {
      try {
        processedContent = await extractContentFromUrl(content)
      } catch (error) {
        return NextResponse.json(
          { error: 'URLからコンテンツを抽出できませんでした。URLを確認してください。' },
          { status: 400 }
        )
      }
    }

    // 指定されたプラットフォームのみ再生成
    const generatedContent = await generateSinglePlatformContent(
      processedContent, 
      platform as 'x' | 'instagram' | 'note', 
      inputType
    )
    
    return NextResponse.json({
      success: true,
      data: {
        [platform]: generatedContent
      }
    })

  } catch (error) {
    console.error('Regeneration API Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'コンテンツの再生成中にエラーが発生しました' 
      },
      { status: 500 }
    )
  }
}