'use client'

import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff } from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface StaticContentInputProps {
  inputType: 'url' | 'text'
  setInputType: (type: 'url' | 'text') => void
  content: string
  setContent: (content: string) => void
  onGenerate: (generatedContent: { x: string; instagram: string[]; note: string; threads: string; html: string }) => void
}

export default function StaticContentInput({
  inputType,
  setInputType,
  content,
  setContent,
  onGenerate,
}: StaticContentInputProps) {
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')

  // ローカルストレージからAPIキーを読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedApiKey = localStorage.getItem('gemini_api_key')
      if (savedApiKey) {
        setApiKey(savedApiKey)
      }
    }
  }, [])

  // APIキーをローカルストレージに保存
  const saveApiKey = (key: string) => {
    if (typeof window !== 'undefined') {
      if (key.trim()) {
        localStorage.setItem('gemini_api_key', key.trim())
      } else {
        localStorage.removeItem('gemini_api_key')
      }
    }
  }

  const handleApiKeyChange = (key: string) => {
    setApiKey(key)
    setApiKeyError('')
    saveApiKey(key)
  }

  const validateApiKey = (key: string): boolean => {
    if (!key || key.trim().length === 0) {
      setApiKeyError('Gemini API キーを入力してください')
      return false
    }
    if (!key.startsWith('AIza')) {
      setApiKeyError('有効なGemini API キーを入力してください（AIzaで始まる必要があります）')
      return false
    }
    if (key.length < 30) {
      setApiKeyError('API キーが短すぎます。正しいキーを入力してください')
      return false
    }
    setApiKeyError('')
    return true
  }

  // レート制限に対するリトライ機能
  const retryWithDelay = async (fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || 
                           error?.message?.includes('quota') || 
                           error?.message?.includes('rate limit')
        
        if (isRateLimit && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) // 指数バックオフ
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          throw error
        }
      }
    }
  }

  const handleGenerate = async () => {
    if (!content.trim()) {
      alert('コンテンツを入力してください')
      return
    }

    if (!validateApiKey(apiKey)) {
      return
    }

    setLoading(true)
    
    try {
      // URLからコンテンツを抽出する場合
      let processedContent = content
      if (inputType === 'url') {
        // 静的サイトでのURL取得は技術的制限があることをユーザーに説明
        throw new Error(`静的サイトではURL取得に技術的制限があります。

解決方法：
1. 記事のURLを開く
2. 記事の内容をコピー（Ctrl+A → Ctrl+C）
3. 「テキスト入力」タブに切り替え
4. コピーした内容をペースト（Ctrl+V）

これにより、より確実にAI生成を実行できます。`)
      }

      // Gemini AIを初期化
      const genAI = new GoogleGenerativeAI(apiKey.trim())
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // X用のコンテンツ生成
      const xPrompt = `
以下のコンテンツを元に、X（Twitter）投稿用の読みやすく親しみやすい文章と画像プロンプトを作成してください。

【投稿者プロフィール】
- 名前：のうと（32歳）
- 職業：都内会社員、ブログ「子育て世代のマネー術」運営
- 家族：妻（派遣社員・同い年）、長男（2歳）
- 住まい：都内賃貸マンション（家賃12万円）
- 目標：子どもの選択肢を全力で応援できる家計づくり
- 経歴：街コンで妻と出会い→結婚→息子誕生を機にお金の勉強開始
- 性格：親しみやすく、失敗体験も包み隠さず共有する

【ターゲット読者層】
- 年齢：30歳前後の子育て世代
- 職業：営業事務職（時短勤務中）、パートナーは営業職
- 家族：夫婦 + 1〜2歳の子ども
- 住まい：東京都内賃貸マンション（家賃12〜15万円）
- 悩み：家計管理の挫折、NISA投資への不安、パートナーとの金銭感覚の違い
- 心境：子育てと仕事で時間がなく、お金の知識不足に焦りを感じている

【必須要件】
- 280文字以内（厳守）
- ターゲット読者が「この人、うちの状況と同じだ！」と共感できる内容
- 記事内にはペルソナの実名（佐藤めぐみ等）は一切出力しない
- 夫婦で読んでもらえるよう、男性目線で論理的かつ親しみやすい表現
- 読者との対話感を演出（「同じような悩みありませんか？」「一緒に頑張りましょう」等）
- リアルな体験談を交える（「僕たちも最初は〜でした」等）
- 適切な改行で読みやすさを向上
- 子育て世代・マネー関連のハッシュタグを3-5個含める
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

【投稿者プロフィール】
- 名前：のうと（32歳）
- 職業：都内会社員、ブログ「子育て世代のマネー術」運営
- 家族：妻（派遣社員・同い年）、長男（2歳）
- 住まい：都内賃貸マンション（家賃12万円）
- 目標：子どもの選択肢を全力で応援できる家計づくり
- 経歴：街コンで妻と出会い→結婚→息子誕生を機にお金の勉強開始
- 性格：親しみやすく、失敗体験も包み隠さず共有する

【ターゲット読者層】
- 年齢：30歳前後の子育て世代
- 職業：営業事務職（時短勤務中）、パートナーは営業職
- 家族：夫婦 + 1〜2歳の子ども
- 住まい：東京都内賃貸マンション（家賃12〜15万円）
- 悩み：家計管理の挫折、NISA投資への不安、パートナーとの金銭感覚の違い
- 心境：子育てと仕事で時間がなく、お金の知識不足に焦りを感じている

【必須要件】
- 各スライド80-120文字程度（読みやすさ重視）
- ターゲット読者が「わかる！これうちと同じ状況！」と共感できる内容
- 記事内にはペルソナの実名（佐藤めぐみ等）は一切出力しない
- のうとさんの体験談として「僕たち夫婦も〜」「最初は僕も〜」等の表現を使用
- 時短勤務ママの忙しさや家計への不安に寄り添う語りかけ
- 共感を呼ぶ感情表現（「わかります！」「そうですよね」「一緒に頑張りましょう」等）
- 関連する絵文字を各スライドに2-3個自然に配置
- 視覚的に読みやすい改行とスペース活用
- ストーリー性のある流れで最後に希望を与える前向きなまとめ

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

【投稿者プロフィール】
- 名前：のうと（32歳）
- 職業：都内会社員、ブログ「子育て世代のマネー術」運営
- 家族：妻（派遣社員・同い年）、長男（2歳）
- 住まい：都内賃貸マンション（家賃12万円）
- 目標：子どもの選択肢を全力で応援できる家計づくり
- 経歴：街コンで妻と出会い→結婚→息子誕生を機にお金の勉強開始
- 性格：親しみやすく、失敗体験も包み隠さず共有する

【ターゲット読者層】
- 年齢：30歳前後の子育て世代
- 職業：営業事務職（時短勤務中）、パートナーは営業職
- 家族：夫婦 + 1〜2歳の子ども
- 住まい：東京都内賃貸マンション（家賃12〜15万円）
- 悩み：家計管理の挫折、NISA投資への不安、パートナーとの金銭感覚の違い
- 心境：子育てと仕事で時間がなく、お金の知識不足に焦りを感じている

【必須要件】
- Markdown形式で美しく構造化（見出し、箇条書き、引用、太字等を効果的に活用）
- のうとさんの視点で「僕たち夫婦の体験談」として執筆
- ターゲット読者が「この記事、まさに今の私の状況だ！」と感じる内容
- 記事内にはペルソナの実名（佐藤めぐみ等）は一切出力しない
- 時短勤務で忙しいママでも読みやすい構成と文体
- 夫にも共有したくなる、男性目線の論理的で親しみやすい表現
- SEO対策：子育て世代・家計管理・NISA関連キーワードを自然に配置
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

      // Threads用のコンテンツ生成
      const threadsPrompt = `
以下のコンテンツを元に、Threads投稿用の読みやすく親しみやすい文章を作成してください。

【投稿者プロフィール】
- 名前：のうと（32歳）
- 職業：都内会社員、ブログ「子育て世代のマネー術」運営
- 家族：妻（派遣社員・同い年）、長男（2歳）
- 住まい：都内賃貸マンション（家賃12万円）
- 性格：親しみやすく、失敗体験も包み隠さず共有する

【ターゲット読者層】
- 年齢：30歳前後の子育て世代
- 職業：営業事務職（時短勤務中）、パートナーは営業職
- 家族：夫婦 + 1〜2歳の子ども
- 悩み：家計管理の挫折、NISA投資への不安、パートナーとの金銭感覚の違い

【必須要件】
- 500文字以内（厳守）
- ターゲット読者が「この人の状況、うちと同じ！」と感じる内容
- 記事内にはペルソナの実名（佐藤めぐみ等）は一切出力しない
- のうとさんの体験談として「僕たち夫婦も〜」等の表現を使用
- 読者との対話感を演出（「同じような経験ありませんか？」「一緒に頑張りましょう」等）
- 感情表現を自然に含める（「最初は僕も不安でした」「今では安心して〜」等）
- 適切な改行で読みやすさを向上
- 子育て世代・マネー関連のハッシュタグを2-3個含める
- 絵文字を適度に使用して親しみやすさを演出

【文章構成】
1. つかみ（共感・疑問・驚き）
2. 核心内容（要点を分かりやすく）
3. 感想・気づき
4. 行動喚起やハッシュタグ

元コンテンツ：
${processedContent}

読みやすく親しみやすいThreads投稿文：`

      // HTML用のコンテンツ生成
      const htmlPrompt = `
以下のコンテンツを元に、完全なHTML形式のブログ記事を作成してください。

【投稿者プロフィール】
- 名前：のうと（32歳）
- 職業：都内会社員、ブログ「子育て世代のマネー術」運営
- 家族：妻（派遣社員・同い年）、長男（2歳）
- 住まい：都内賃貸マンション（家賃12万円）
- 目標：子どもの選択肢を全力で応援できる家計づくり
- 性格：親しみやすく、失敗体験も包み隠さず共有する

【ターゲット読者層】
- 年齢：30歳前後の子育て世代
- 職業：営業事務職（時短勤務中）、パートナーは営業職
- 家族：夫婦 + 1〜2歳の子ども
- 住まい：東京都内賃貸マンション（家賃12〜15万円）
- 悩み：家計管理の挫折、NISA投資への不安、パートナーとの金銭感覚の違い
- 心境：子育てと仕事で時間がなく、お金の知識不足に焦りを感じている

【必須要件】
- 完全なHTML5形式（DOCTYPE、head、body含む）
- レスポンシブデザイン対応のCSS
- SEO対策されたメタタグ（子育て世代・家計管理・NISA関連キーワード）
- 読みやすいタイポグラフィ
- のうとさんの視点で「僕たち夫婦の体験談」として執筆
- ターゲット読者が「この記事、まさに今の私の状況だ！」と感じる内容
- 記事内にはペルソナの実名（佐藤めぐみ等）は一切出力しない
- 時短勤務で忙しいママでも読みやすい構成
- 夫にも共有したくなる、男性目線の論理的で親しみやすい表現
- 2000-3000文字程度の読み応えのある内容
- 構造化されたマークアップ（見出し、段落、リスト等）

【HTML構成】
1. HTMLヘッダー（メタタグ、CSS等）
2. 記事タイトル（H1）
3. 導入部分
4. 本文（複数のH2、H3見出しで構成）
5. まとめ
6. フッター

【CSS要件】
- レスポンシブデザイン
- 読みやすいフォント設定
- 適切な行間・余白
- 美しい配色
- モバイルファーストデザイン

元コンテンツ：
${processedContent}

完全なHTML形式のブログ記事：`

      // 並列でAPIを呼び出し（リトライ機能付き）
      const [xResult, instagramResult, noteResult, threadsResult, htmlResult] = await Promise.all([
        retryWithDelay(() => model.generateContent(xPrompt)),
        retryWithDelay(() => model.generateContent(instagramPrompt)),
        retryWithDelay(() => model.generateContent(notePrompt)),
        retryWithDelay(() => model.generateContent(threadsPrompt)),
        retryWithDelay(() => model.generateContent(htmlPrompt))
      ])

      const xText = xResult.response.text()
      const instagramText = instagramResult.response.text()
      const noteText = noteResult.response.text()
      const threadsText = threadsResult.response.text()
      const htmlText = htmlResult.response.text()

      // Instagramのカルーセルを分割
      const instagramSlides = instagramText
        .split('---')
        .map((slide: string) => slide.trim())
        .filter((slide: string) => slide.length > 0)
        .slice(0, 10) // 最大10枚

      // 10枚に満たない場合は追加
      while (instagramSlides.length < 10) {
        instagramSlides.push(`${instagramSlides.length + 1}枚目のスライド内容を追加してください。`)
      }

      onGenerate({
        x: xText,
        instagram: instagramSlides,
        note: noteText,
        threads: threadsText,
        html: htmlText
      })

    } catch (error) {
      console.error('Content generation error:', error)
      
      const errorMessage = error instanceof Error ? error.message : ''
      
      let userMessage = ''
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        userMessage = `⚠️ API利用制限に達しました

Gemini APIの無料プランでは1日あたり50回のリクエスト制限があります。

解決方法：
• 24時間待ってから再度お試しください
• より多くのリクエストが必要な場合は、Google AI Studioで有料プランにアップグレードしてください
• 生成済みのコンテンツは保存されているので、編集して活用できます

参考: https://ai.google.dev/gemini-api/docs/rate-limits`
      } else if (errorMessage.includes('API key')) {
        userMessage = 'APIキーが無効です。正しいGemini APIキーを設定してください。'
      } else {
        userMessage = error instanceof Error 
          ? error.message 
          : 'コンテンツの生成中にエラーが発生しました。しばらく待ってから再度お試しください。'
      }
      
      alert(userMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="heading-3 mb-6">AI コンテンツ生成 (静的サイト版)</h2>
      
      {/* API Key Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Gemini API キー
          </div>
        </label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            className={`input-field pr-12 ${apiKeyError ? 'border-red-500' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {apiKeyError && (
          <p className="mt-1 text-sm text-red-600">{apiKeyError}</p>
        )}
        {!apiKey && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <a 
                href="https://ai.google.dev/gemini-api/docs/api-key" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-800 hover:underline font-medium"
              >
                Google AI Studio
              </a> でGemini API キーを取得してください。キーはブラウザに安全に保存されます。
            </p>
          </div>
        )}
      </div>
      
      {/* Input Type Toggle */}
      <div className="mb-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setInputType('text')}
            className={`tab-button flex-1 ${inputType === 'text' ? 'active' : ''}`}
          >
            📝 テキスト入力（推奨）
          </button>
          <button
            onClick={() => setInputType('url')}
            className={`tab-button flex-1 ${inputType === 'url' ? 'active' : ''} opacity-75`}
          >
            🌐 URL入力（制限あり）
          </button>
        </div>
      </div>

      {/* Input Field */}
      <div className="mb-4">
        {inputType === 'url' ? (
          <input
            type="url"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://example.com/article"
            className="input-field"
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="記事のテキストを入力してください..."
            rows={8}
            className="input-field resize-none"
          />
        )}
      </div>

      {/* Character Count */}
      {content && (
        <div className="mb-4">
          <p className="small-text text-right">
            {content.length} 文字
          </p>
        </div>
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!content.trim() || loading || !apiKey.trim()}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="loading-spinner"></div>
            AI生成中...
          </>
        ) : (
          '🚀 AI生成開始'
        )}
      </button>

      {/* Help Text */}
      <div className="mt-4 space-y-3">
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="small-text text-green-700">
            ✨ このツールは高品質なX投稿、Instagram投稿、note記事を一度に生成します（静的サイト版）
          </p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="small-text text-blue-700">
            💡 より良い結果を得るために、具体的で詳細なコンテンツを入力してください
          </p>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg">
          <p className="small-text text-indigo-700">
            📝 推奨：記事をコピー&ペーストして「テキスト入力」をご利用ください
          </p>
        </div>
        {inputType === 'url' && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="small-text text-red-700">
              ⚠️ 静的サイト版ではURL取得に制限があります。テキスト入力の使用を強く推奨します
            </p>
          </div>
        )}
        {!apiKey && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="small-text text-yellow-700">
              🔑 AI生成を開始するにはGemini API キーが必要です
            </p>
          </div>
        )}
        <div className="p-3 bg-amber-50 rounded-lg">
          <p className="small-text text-amber-700">
            ⚠️ <strong>利用制限について:</strong> Gemini APIの無料プランでは1日あたり50回のリクエスト制限があります。制限に達した場合は24時間後に再度お試しください。
          </p>
        </div>
      </div>
    </div>
  )
}