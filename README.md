# 生成記事自動投稿ツール

AIを活用したSEO最適化記事生成・SNS投稿ツール

## 🚀 機能

- **コンテンツ入力**: URLまたはテキスト直接入力
- **AI文章生成**: Gemini APIを使用した高品質な文章生成
- **マルチプラットフォーム対応**: X(Twitter)、Instagram、note用に最適化
- **SEO最適化**: キーワード自動統合と最適化
- **レスポンシブデザイン**: モバイル・タブレット・PC対応

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルでGemini API キーを設定してください：

```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 📋 使用方法

### 1. コンテンツ入力
- **URL入力**: 記事のURLを入力してコンテンツを自動抽出
- **テキスト入力**: 記事のテキストを直接貼り付け

### 2. 生成開始
- 「生成開始」ボタンをクリックしてAIが各SNS用のコンテンツを生成

### 3. 編集・プレビュー
- **X(Twitter)**: 280文字以内、ハッシュタグ付き
- **Instagram**: 10枚のカルーセル形式
- **note**: マークダウン形式の記事

### 4. 投稿設定
- 投稿したいSNSを選択して「今すぐ投稿」

## 🎨 デザイン特徴

- **クリーンでモダン**: 白を基調とした洗練されたデザイン
- **Interフォント**: 読みやすく美しいタイポグラフィ
- **グラデーション**: 魅力的な視覚効果
- **アニメーション**: スムーズなトランジション

## 🔧 技術スタック

- **フロントエンド**: Next.js 15 (App Router)
- **スタイリング**: TailwindCSS 4
- **言語**: TypeScript
- **AI**: Google Gemini API
- **HTML解析**: Cheerio

## 📁 プロジェクト構造

```
├── src/
│   ├── app/
│   │   ├── api/generate/route.ts    # コンテンツ生成API
│   │   ├── globals.css              # グローバルスタイル
│   │   ├── layout.tsx               # ルートレイアウト
│   │   └── page.tsx                 # メインページ
│   ├── components/
│   │   ├── ContentInput.tsx         # コンテンツ入力コンポーネント
│   │   ├── ContentEditor.tsx        # 編集・プレビューコンポーネント
│   │   └── PostSettings.tsx         # 投稿設定コンポーネント
│   └── lib/
│       └── gemini.ts                # Gemini API関連機能
├── .env.local                       # 環境変数
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🌟 主な改善点

### デザイン
- モダンで洗練されたUI/UX
- カード型レイアウトでコンテンツを整理
- アイコンとグラデーションで視覚的魅力を向上
- レスポンシブデザインで全デバイス対応

### 機能
- 実際のGemini APIを使用した高品質な文章生成
- URLからの自動コンテンツ抽出
- 各SNSに最適化されたフォーマット
- エラーハンドリングとユーザーフィードバック

## 🔑 Gemini API キーの取得方法

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Create API Key」をクリック
4. 生成されたAPIキーを `.env.local` に設定

## 📝 注意事項

- Gemini APIの利用制限にご注意ください
- 本番環境では適切なレート制限を実装してください
- 生成されたコンテンツは投稿前に必ず確認してください

---

**開発者**: Claude Code
**バージョン**: 4.0