export class HTMLService {
  async generateHTML(title: string, content: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // HTMLテンプレートを生成
      const htmlContent = this.createHTMLTemplate(title, content)
      
      // ダウンロード用のBlob URLを作成
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      return { 
        success: true, 
        data: { 
          html: htmlContent,
          downloadUrl: url,
          filename: `${this.sanitizeFilename(title)}.html`
        } 
      }
    } catch (error) {
      console.error('HTML Generation Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'HTML生成に失敗しました' 
      }
    }
  }

  private createHTMLTemplate(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .content {
            margin-top: 30px;
        }
        .content p {
            margin-bottom: 1em;
        }
        .generated-info {
            margin-top: 40px;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            font-size: 0.9em;
            color: #666;
        }
        pre {
            background-color: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(title)}</h1>
    <div class="content">
        ${this.formatContent(content)}
    </div>
    <div class="generated-info">
        <p>この記事は ${new Date().toLocaleDateString('ja-JP')} に生成されました。</p>
    </div>
</body>
</html>`
  }

  private formatContent(content: string): string {
    // 基本的なMarkdown風のフォーマットをHTMLに変換
    return content
      .split('\n')
      .map(line => {
        // 見出し
        if (line.startsWith('## ')) {
          return `<h2>${this.escapeHtml(line.slice(3))}</h2>`
        }
        if (line.startsWith('### ')) {
          return `<h3>${this.escapeHtml(line.slice(4))}</h3>`
        }
        // リスト
        if (line.startsWith('- ')) {
          return `<li>${this.escapeHtml(line.slice(2))}</li>`
        }
        // 空行
        if (line.trim() === '') {
          return '<br>'
        }
        // 通常の段落
        return `<p>${this.escapeHtml(line)}</p>`
      })
      .join('\n')
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100)
  }

  async downloadHTML(title: string, content: string): Promise<void> {
    const result = await this.generateHTML(title, content)
    
    if (result.success && result.data) {
      const link = document.createElement('a')
      link.href = result.data.downloadUrl
      link.download = result.data.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // メモリを解放
      URL.revokeObjectURL(result.data.downloadUrl)
    }
  }
}