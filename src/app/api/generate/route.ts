import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { content, inputType, apiKey } = await request.json()

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'コンテンツが入力されていません。' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Gemini API キーが設定されていません。' },
        { status: 400 }
      )
    }

    // URLからコンテンツを抽出する場合
    let processedContent = content
    if (inputType === 'url') {
      try {
        const response = await fetch(content)
        if (!response.ok) {
          throw new Error('URLからコンテンツを取得できませんでした')
        }
        
        const html = await response.text()
        
        // 基本的なHTMLタグを除去してテキストを抽出
        processedContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        
        // 長すぎる場合は適切な長さに制限
        processedContent = processedContent.length > 3000 
          ? processedContent.substring(0, 3000) + '...' 
          : processedContent
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'URLからコンテンツを抽出できませんでした。URLを確認してください。' },
          { status: 400 }
        )
      }
    }

    // Gemini AIを初期化
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // X用のコンテンツ生成
    const xPrompt = `
以下のコンテンツを元に、X（Twitter）投稿用の読みやすく親しみやすい文章と画像プロンプトを作成してください。

【必須要件】
- 280文字以内（厳守）
- 中学生でも理解できる平易で親しみやすい表現
- 読者との対話感を演出（「みなさん」「一緒に」「どう思いますか？」等）
- 感情表現を自然に含める（「驚きました！」「感動しました」「気づかされました」等）
- 適切な改行で読みやすさを向上
- トレンドを意識したハッシュタグを3-5個含める
- SEO効果の高いキーワードを自然に配置
- 投稿に合う画像プロンプトを1個作成

【文章構成】
1. つかみ（共感・疑問・驚き）
2. 核心内容（要点を分かりやすく）
3. 感想・気づき
4. 行動喚起やハッシュタグ

【画像プロンプト要件】
投稿内容に合わせて1個の画像プロンプトを作成してください。数字やデータがある場合は必ずファーストインプレッションで伝わる視覚的なデザインを優先してください。
- 「[画像1]」で番号を付ける
- アスペクト比16:9の横長画像として設計する
- **白背景必須**: 背景は必ず白色（#FFFFFF）にする
- **タイトル表示**: 上部に画像の内容を表す分かりやすいタイトルを配置
- **数字・データ重視**: 投稿に具体的な数字、統計、パーセンテージ、金額等がある場合は、以下を最優先で含める：
  * 中央に大きく目立つ数字やパーセンテージの表示（画面の30-40%を占める大きさ）
  * 簡潔で分かりやすいグラフ（棒グラフ、円グラフ、矢印グラフ等）
  * 数値の比較や変化を示すビフォーアフター表示
  * インパクトのある数字を強調するカラフルなデザイン要素
- **ファーストインプレッション重視**: 一瞬で何を伝えたいかが分かるデザイン
- **右下ロゴスペース確保**: 右下角に縦横50px程度の正方形の空白エリアを必ず確保（何も配置しない）
- 人物を含む場合は必ず日本人を指定する
- プロンプトは具体的で詳細に（構図、色調、スタイル、雰囲気、使用する具体的な数値を明記）
- AIで生成可能な現実的なプロンプトにする
- 各プロンプトの最後に「16:9のアスペクト比、白背景、右下角に50px正方形の空白エリア、高品質、SNS投稿向け、数字強調デザイン」を追加する

元コンテンツ：
${processedContent}

読みやすく親しみやすいX投稿文（画像プロンプト含む）：`

    // Instagram用のコンテンツ生成
    const instagramPrompt = `
以下のコンテンツを元に、Instagram投稿用の親しみやすいカルーセル形式（10枚）の文章を作成してください。

【必須要件】
- 各スライド80-120文字程度（読みやすさ重視）
- 中学生でも理解できる平易で親しみやすい表現
- 読者に寄り添う語りかけ（「みなさんは」「きっと」「一緒に」等）
- 共感を呼ぶ感情表現（「わかります！」「そうですよね」「嬉しいですね」等）
- 関連する絵文字を各スライドに2-3個自然に配置
- 視覚的に読みやすい改行とスペース活用
- ストーリー性のある流れで最後に感動的なまとめ

【カルーセル構成】
1枚目: インパクトのあるタイトル + つかみ
2-8枚目: 内容を分かりやすく段階的に説明
9枚目: 気づき・学び・感想
10枚目: 行動喚起・メッセージ・ハッシュタグ

元コンテンツ：
${processedContent}

親しみやすいInstagram用カルーセル（各スライドを「---」で区切ってください）：`

    // note用のコンテンツ生成
    const notePrompt = `
以下のコンテンツを元に、SEO対策された読みやすく親しみやすいnote記事を作成してください。

【必須要件】
- Markdown形式で美しく構造化（見出し、箇条書き、引用、太字等を効果的に活用）
- 中学生でも理解できる平易で親しみやすい表現、丁寧語を使用
- 読者に寄り添う語りかけ（「みなさん」「きっと」「一緒に考えてみましょう」等）
- 共感を呼ぶ感情表現と体験談風の語り口
- SEO対策：関連キーワードを自然に配置、検索意図に応える内容構成
- 読みやすさ：適切な改行、段落分け、視覚的な読みやすさ
- 2000-2500文字程度の読み応えのある内容
- 最後に読者への行動喚起やメッセージを含める
- 記事の要所に配置する画像の詳細なプロンプトを3-5個含める

【記事構成】
1. 魅力的なタイトル（H1）
2. 導入部分：読者の問題意識に共感
3. 本文：
   - 複数のH2見出しで内容を整理
   - 具体例や体験談を交える
   - 読者の疑問に答える形で展開
   - 各セクションに適切な画像を配置
4. まとめ：学びや気づきを整理
5. 最後に：読者への感謝とメッセージ

【画像プロンプト要件】
記事の内容に合わせて3-5個の画像プロンプトを作成してください。数字やデータがある場合は必ずグラフや数値を強調した画像を優先してください。
- 各画像プロンプトは「[画像1]」「[画像2]」のように番号を付ける
- アスペクト比16:9の横長画像として設計する
- **数字・データ重視**: 記事に具体的な数字、統計、パーセンテージ、金額等がある場合は、以下を優先的に含める：
  * 棒グラフ、円グラフ、折れ線グラフ等の視覚的データ表現
  * 大きく表示された数字やパーセンテージ
  * 比較表やランキング形式の視覚表現
  * インフォグラフィック風のデザイン
- 人物を含む場合は必ず日本人を指定する（例：「日本人の20代女性」「日本人のビジネスマン」等）
- プロンプトは具体的で詳細に（構図、色調、スタイル、雰囲気、照明、使用する具体的な数値を明記）
- 記事の内容を視覚的に表現し、読者の理解を助ける内容
- AIで生成可能な現実的なプロンプトにする
- 各プロンプトの最後に「16:9のアスペクト比、高品質、明るく親しみやすい雰囲気」を追加する

【数字・グラフ画像の例】
- 「売上30%アップを示すカラフルな棒グラフ、青とオレンジのグラデーション、現代的なデザイン」
- 「月収50万円という数字を強調したインフォグラフィック、金色の数字、コインやお金のアイコン」
- 「3つのステップを示すフローチャート図、矢印と数字1,2,3が目立つデザイン」

【SEO対策ポイント】
- タイトルと見出しに検索キーワードを自然に含める
- 読者の検索意図に応える包括的な内容
- 関連キーワードを記事全体に自然に散りばめる
- 読みやすい文章構成で滞在時間を向上

元コンテンツ：
${processedContent}

SEO対策された読みやすく親しみやすいnote記事（画像プロンプト含む）：`

    // 並列でAPIを呼び出し
    const [xResult, instagramResult, noteResult] = await Promise.all([
      model.generateContent(xPrompt),
      model.generateContent(instagramPrompt),
      model.generateContent(notePrompt)
    ])

    const xText = xResult.response.text()
    const instagramText = instagramResult.response.text()
    const noteText = noteResult.response.text()

    // Instagramのカルーセルを分割
    const instagramSlides = instagramText
      .split('---')
      .map(slide => slide.trim())
      .filter(slide => slide.length > 0)
      .slice(0, 10) // 最大10枚

    // 10枚に満たない場合は追加
    while (instagramSlides.length < 10) {
      instagramSlides.push(`${instagramSlides.length + 1}枚目のスライド内容を追加してください。`)
    }

    return NextResponse.json({
      success: true,
      data: {
        x: xText,
        instagram: instagramSlides,
        note: noteText
      }
    })

  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'コンテンツの生成中にエラーが発生しました。' 
      },
      { status: 500 }
    )
  }
}