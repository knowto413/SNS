'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Play, Pause } from 'lucide-react'

interface ContentEditorProps {
  generatedContent: {
    x: string
    instagram: string[]
    note: string
    threads: string
    html: string
  }
  setGeneratedContent: (content: { x: string; instagram: string[]; note: string; threads: string; html: string }) => void
  originalContent: string
  inputType: 'url' | 'text'
}

export default function ContentEditor({ generatedContent, setGeneratedContent, originalContent, inputType }: ContentEditorProps) {
  const [activeTab, setActiveTab] = useState<'x' | 'instagram' | 'note' | 'threads' | 'html'>('x')
  const [isRegenerating, setIsRegenerating] = useState<string | null>(null)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true) // 初期状態で自動切り替えを有効
  const [autoSwitchInterval, setAutoSwitchInterval] = useState<NodeJS.Timeout | null>(null)

  const tabs = ['x', 'instagram', 'note', 'threads', 'html'] as const

  // 自動切り替え機能
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setActiveTab(current => {
          const currentIndex = tabs.indexOf(current)
          return tabs[(currentIndex + 1) % tabs.length]
        })
      }, 3000) // 3秒ごとに切り替え

      setAutoSwitchInterval(interval)
      return () => clearInterval(interval)
    } else {
      if (autoSwitchInterval) {
        clearInterval(autoSwitchInterval)
        setAutoSwitchInterval(null)
      }
    }
  }, [isAutoPlaying])

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      if (autoSwitchInterval) {
        clearInterval(autoSwitchInterval)
      }
    }
  }, [autoSwitchInterval])

  const handleTabClick = (tab: 'x' | 'instagram' | 'note' | 'threads' | 'html') => {
    setActiveTab(tab)
    // 手動でタブを切り替えた場合は自動再生を一時停止
    if (isAutoPlaying) {
      setIsAutoPlaying(false)
    }
  }

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  const handleContentChange = (platform: 'x' | 'instagram' | 'note' | 'threads' | 'html', value: string | string[]) => {
    setGeneratedContent({
      ...generatedContent,
      [platform]: value,
    })
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

  const regenerateContent = async (platform: 'x' | 'instagram' | 'note' | 'threads' | 'html') => {
    // APIキーをローカルストレージから取得
    const apiKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null
    
    if (!apiKey) {
      alert('Gemini API キーが設定されていません。コンテンツ入力欄でAPIキーを設定してください。')
      return
    }

    setIsRegenerating(platform)
    
    try {
      // 静的サイト版：直接Gemini APIを呼び出し
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey.trim())
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // 共通のプロフィール・ペルソナ情報
      const profileInfo = `
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
- 心境：子育てと仕事で時間がなく、お金の知識不足に焦りを感じている`

      let prompt = ''
      
      if (platform === 'x') {
        prompt = `
以下のコンテンツを元に、X（Twitter）投稿用の読みやすく親しみやすい文章と画像プロンプトを作成してください。

${profileInfo}

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
${originalContent}

読みやすく親しみやすいX投稿文（画像プロンプト含む）：`
      } else if (platform === 'instagram') {
        prompt = `
以下のコンテンツを元に、Instagram投稿用の親しみやすいカルーセル形式（10枚）の文章を作成してください。

${profileInfo}

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
${originalContent}

親しみやすいInstagram用カルーセル（各スライドを「---」で区切ってください）：`
      } else if (platform === 'note') {
        prompt = `
以下のコンテンツを元に、SEO対策された読みやすく親しみやすいnote記事を作成してください。

${profileInfo}

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
${originalContent}

SEO対策された読みやすく親しみやすいnote記事（画像プロンプト含む）：`
      } else if (platform === 'threads') {
        prompt = `
以下のコンテンツを元に、Threads投稿用の読みやすく親しみやすい文章を作成してください。

${profileInfo}

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
${originalContent}

読みやすく親しみやすいThreads投稿文：`
      } else if (platform === 'html') {
        prompt = `
以下のコンテンツを元に、完全なHTML形式のブログ記事を作成してください。

${profileInfo}

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
${originalContent}

完全なHTML形式のブログ記事：`
      }

      const result = await retryWithDelay(() => model.generateContent(prompt))
      const generatedText = result.response.text()

      if (platform === 'instagram') {
        // Instagramのカルーセルを分割
        const instagramSlides = generatedText
          .split('---')
          .map((slide: string) => slide.trim())
          .filter((slide: string) => slide.length > 0)
          .slice(0, 10) // 最大10枚

        // 10枚に満たない場合は追加
        while (instagramSlides.length < 10) {
          instagramSlides.push(`${instagramSlides.length + 1}枚目のスライド内容を追加してください。`)
        }

        setGeneratedContent({
          ...generatedContent,
          [platform]: instagramSlides,
        })
      } else {
        setGeneratedContent({
          ...generatedContent,
          [platform]: generatedText,
        })
      }
    } catch (error) {
      console.error('再生成エラー:', error)
      
      const errorMessage = error instanceof Error ? error.message : ''
      
      let userMessage = ''
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        userMessage = `⚠️ API利用制限に達しました

Gemini APIの無料プランでは1日あたり50回のリクエスト制限があります。

解決方法：
• 24時間待ってから再度お試しください
• より多くのリクエストが必要な場合は、Google AI Studioで有料プランにアップグレードしてください
• 現在のコンテンツを手動で編集して活用できます

参考: https://ai.google.dev/gemini-api/docs/rate-limits`
      } else if (errorMessage.includes('API key')) {
        userMessage = 'APIキーが無効です。正しいGemini APIキーを設定してください。'
      } else {
        userMessage = error instanceof Error 
          ? error.message 
          : '再生成に失敗しました。しばらく待ってから再度お試しください。'
      }
      
      alert(userMessage)
    } finally {
      setIsRegenerating(null)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="heading-3">コンテンツ編集・プレビュー</h2>
        <button
          onClick={toggleAutoPlay}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isAutoPlaying 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isAutoPlaying ? '自動切替中' : '自動切替'}
        </button>
      </div>
      
      {/* Platform Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg relative">
          {/* Progress bar for auto-switching */}
          {isAutoPlaying && (
            <div 
              className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-full transition-all duration-[3000ms] ease-linear"
              style={{ 
                width: '20%', 
                transform: `translateX(${tabs.indexOf(activeTab) * 500}%)` 
              }}
            />
          )}
          <button
            onClick={() => handleTabClick('x')}
            className={`tab-button flex-1 ${activeTab === 'x' ? 'active' : ''}`}
          >
            X (Twitter)
          </button>
          <button
            onClick={() => handleTabClick('instagram')}
            className={`tab-button flex-1 ${activeTab === 'instagram' ? 'active' : ''}`}
          >
            Instagram
          </button>
          <button
            onClick={() => handleTabClick('note')}
            className={`tab-button flex-1 ${activeTab === 'note' ? 'active' : ''}`}
          >
            note
          </button>
          <button
            onClick={() => handleTabClick('threads')}
            className={`tab-button flex-1 ${activeTab === 'threads' ? 'active' : ''}`}
          >
            Threads
          </button>
          <button
            onClick={() => handleTabClick('html')}
            className={`tab-button flex-1 ${activeTab === 'html' ? 'active' : ''}`}
          >
            HTML
          </button>
        </div>
        <div className="mt-2 text-center">
          {isAutoPlaying ? (
            <p className="small-text text-blue-600">
              🔄 3秒ごとに自動切り替え中（手動切り替えで一時停止）
            </p>
          ) : (
            <p className="small-text text-gray-500">
              📱 自動切り替えをオンにすると、スクロール不要で全てのコンテンツを確認できます
            </p>
          )}
        </div>
      </div>

      {/* Content Editor */}
      <div>
        {activeTab === 'x' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="body-text font-medium">X投稿内容</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => regenerateContent('x')}
                  disabled={isRegenerating === 'x'}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3 w-3 ${isRegenerating === 'x' ? 'animate-spin' : ''}`} />
                  再生成
                </button>
                <span className={`small-text ${
                  generatedContent.x.length > 260 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {generatedContent.x.length}/280
                </span>
              </div>
            </div>
            <textarea
              value={generatedContent.x}
              onChange={(e) => handleContentChange('x', e.target.value)}
              maxLength={280}
              rows={4}
              className="input-field resize-none"
              placeholder="X用の投稿内容..."
            />
          </div>
        )}

        {activeTab === 'instagram' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <label className="body-text font-medium">Instagram カルーセル投稿</label>
                <p className="small-text text-gray-500">10枚のスライドで構成</p>
              </div>
              <button
                onClick={() => regenerateContent('instagram')}
                disabled={isRegenerating === 'instagram'}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3 w-3 ${isRegenerating === 'instagram' ? 'animate-spin' : ''}`} />
                再生成
              </button>
            </div>
            <div className="space-y-4">
              {generatedContent.instagram.map((slide, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="body-text font-medium">スライド {index + 1}</label>
                    <span className="small-text text-gray-500">{slide.length} 文字</span>
                  </div>
                  <textarea
                    value={slide}
                    onChange={(e) => {
                      const newSlides = [...generatedContent.instagram]
                      newSlides[index] = e.target.value
                      handleContentChange('instagram', newSlides)
                    }}
                    rows={3}
                    className="input-field resize-none"
                    placeholder={`スライド ${index + 1} の内容...`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'note' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="body-text font-medium">note記事内容</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => regenerateContent('note')}
                  disabled={isRegenerating === 'note'}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3 w-3 ${isRegenerating === 'note' ? 'animate-spin' : ''}`} />
                  再生成
                </button>
                <span className="small-text text-gray-500">Markdown形式</span>
              </div>
            </div>
            <textarea
              value={generatedContent.note}
              onChange={(e) => handleContentChange('note', e.target.value)}
              rows={12}
              className="input-field resize-none font-mono text-sm"
              placeholder="# タイトル

## 見出し

本文内容...

- リスト項目1
- リスト項目2"
            />
            <div className="mt-2 p-3 bg-green-50 rounded-lg">
              <p className="small-text text-green-700">
                ℹ️ Markdown記法（# 見出し、**太字**、- リストなど）が使用できます
              </p>
            </div>
          </div>
        )}

        {activeTab === 'threads' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="body-text font-medium">Threads投稿内容</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => regenerateContent('threads')}
                  disabled={isRegenerating === 'threads'}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3 w-3 ${isRegenerating === 'threads' ? 'animate-spin' : ''}`} />
                  再生成
                </button>
                <span className={`small-text ${
                  generatedContent.threads.length > 480 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {generatedContent.threads.length}/500
                </span>
              </div>
            </div>
            <textarea
              value={generatedContent.threads}
              onChange={(e) => handleContentChange('threads', e.target.value)}
              maxLength={500}
              rows={6}
              className="input-field resize-none"
              placeholder="Threads用の投稿内容..."
            />
          </div>
        )}

        {activeTab === 'html' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="body-text font-medium">HTML記事内容</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => regenerateContent('html')}
                  disabled={isRegenerating === 'html'}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`h-3 w-3 ${isRegenerating === 'html' ? 'animate-spin' : ''}`} />
                  再生成
                </button>
                <span className="small-text text-gray-500">HTML形式</span>
              </div>
            </div>
            <textarea
              value={generatedContent.html}
              onChange={(e) => handleContentChange('html', e.target.value)}
              rows={15}
              className="input-field resize-none font-mono text-xs"
              placeholder="<!DOCTYPE html>
<html lang='ja'>
<head>
  <meta charset='UTF-8'>
  <title>記事タイトル</title>
</head>
<body>
  <h1>記事タイトル</h1>
  <p>記事内容...</p>
</body>
</html>"
            />
            <div className="mt-2 p-3 bg-orange-50 rounded-lg">
              <p className="small-text text-orange-700">
                ℹ️ 完全なHTML形式でブログ記事が生成されます
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}