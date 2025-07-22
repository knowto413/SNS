import axios from 'axios'

export class InstagramService {
  private accessToken: string
  private userId: string

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken
    this.userId = userId
  }

  async postCarousel(slides: string[]): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // まず各スライドの画像を生成（実際の実装では画像生成APIを使用）
      const mediaIds = []
      
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i]
        
        // テキストを画像に変換するためのAPI呼び出し（模擬）
        const imageUrl = await this.generateImageFromText(slide, i + 1)
        
        // Instagram Graph APIにメディアをアップロード
        const mediaResponse = await axios.post(
          `https://graph.facebook.com/v18.0/${this.userId}/media`,
          {
            image_url: imageUrl,
            caption: slide,
            access_token: this.accessToken,
          }
        )
        
        mediaIds.push(mediaResponse.data.id)
      }

      // カルーセル投稿を作成
      const carouselResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.userId}/media`,
        {
          media_type: 'CAROUSEL',
          children: mediaIds,
          access_token: this.accessToken,
        }
      )

      // 投稿を公開
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.userId}/media_publish`,
        {
          creation_id: carouselResponse.data.id,
          access_token: this.accessToken,
        }
      )

      return { success: true, data: publishResponse.data }
    } catch (error) {
      console.error('Instagram API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Instagram投稿に失敗しました' 
      }
    }
  }

  private async generateImageFromText(text: string, slideNumber: number): Promise<string> {
    // 実際の実装では、Canva API, Bannerbear API, または独自の画像生成サービスを使用
    // ここでは模擬的なURLを返します
    return `https://via.placeholder.com/1080x1080/4F46E5/FFFFFF?text=Slide+${slideNumber}`
  }

  async getUserInfo(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/me?fields=id,username&access_token=${this.accessToken}`
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Instagram API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'ユーザー情報の取得に失敗しました' 
      }
    }
  }
}