#!/bin/bash

echo "🚀 Building static version for GitHub Pages..."

# APIルートを一時的に移動
if [ -d "src/app/api" ]; then
    echo "📦 Moving API routes temporarily..."
    mv src/app/api src/app/api.temp
fi

# ビルド実行
echo "🔨 Building Next.js application..."
NODE_ENV=production NEXT_PUBLIC_VERCEL_ENV=github npm run build

# ビルド結果を確認
if [ ! -d "out" ]; then
    echo "❌ Error: out directory not generated"
    
    # APIルートを復元してから終了
    if [ -d "src/app/api.temp" ]; then
        mv src/app/api.temp src/app/api
    fi
    
    exit 1
fi

# .nojekyllファイルを作成
touch out/.nojekyll

# favicon.icoをコピー
echo "🎨 Copying favicon.ico..."
if [ -f "public/favicon.ico" ]; then
    cp public/favicon.ico out/
    echo "✅ favicon.ico copied successfully"
else
    echo "⚠️ Warning: public/favicon.ico not found"
fi

# index.htmlが存在するか確認
if [ ! -f "out/index.html" ]; then
    echo "❌ Error: index.html not found in out directory"
    ls -la out/
    
    # APIルートを復元してから終了
    if [ -d "src/app/api.temp" ]; then
        mv src/app/api.temp src/app/api
    fi
    
    exit 1
fi

# APIルートを復元
if [ -d "src/app/api.temp" ]; then
    echo "📦 Restoring API routes..."
    mv src/app/api.temp src/app/api
fi

echo "✅ Static build completed successfully!"
echo "📂 Generated files in out/ directory:"
ls -la out/

echo "🌐 Ready for GitHub Pages deployment!"