'use client'

import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff } from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface StaticContentInputProps {
  inputType: 'url' | 'text'
  setInputType: (type: 'url' | 'text') => void
  content: string
  setContent: (content: string) => void
  onGenerate: (generatedContent: { x: string; instagram: string[]; note: string }) => void
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
          throw new Error('URLからコンテンツを抽出できませんでした。URLを確認してください。')
        }
      }

      // Gemini AIを初期化
      const genAI = new GoogleGenerativeAI(apiKey.trim())
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

      onGenerate({
        x: xText,
        instagram: instagramSlides,
        note: noteText
      })

    } catch (error) {
      console.error('Content generation error:', error)
      alert(
        error instanceof Error 
          ? error.message 
          : 'コンテンツの生成中にエラーが発生しました。しばらく待ってから再度お試しください。'
      )
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
            onClick={() => setInputType('url')}
            className={`tab-button flex-1 ${inputType === 'url' ? 'active' : ''}`}
          >
            URL入力
          </button>
          <button
            onClick={() => setInputType('text')}
            className={`tab-button flex-1 ${inputType === 'text' ? 'active' : ''}`}
          >
            テキスト入力
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
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="small-text text-purple-700">
            🔧 この静的サイト版では、Gemini APIを直接ブラウザから呼び出しています
          </p>
        </div>
        {!apiKey && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="small-text text-yellow-700">
              ⚠️ AI生成を開始するにはGemini API キーが必要です
            </p>
          </div>
        )}
      </div>
    </div>
  )
}