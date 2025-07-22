import { NextRequest, NextResponse } from 'next/server'
import { generateContentWithGemini, extractContentFromUrl } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const { content, inputType } = await request.json()

    if (!content) {
      return NextResponse.json(
        { error: 'コンテンツが入力されていません' },
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

    // Gemini APIで各SNS用のコンテンツを生成
    const generatedContent = await generateContentWithGemini(processedContent, inputType)

    return NextResponse.json({
      success: true,
      data: generatedContent
    })

  } catch (error) {
    console.error('Generation API Error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'コンテンツの生成中にエラーが発生しました' 
      },
      { status: 500 }
    )
  }
}