import axios from 'axios'

export class ThreadsService {
  private accessToken: string
  private userId: string

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken
    this.userId = userId
  }

  async postThread(content: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Threads Graph APIを使用して投稿を作成
      const response = await axios.post(
        `https://graph.threads.net/v1.0/${this.userId}/threads`,
        {
          media_type: 'TEXT',
          text: content,
          access_token: this.accessToken,
        }
      )

      // 投稿を公開
      const publishResponse = await axios.post(
        `https://graph.threads.net/v1.0/${this.userId}/threads_publish`,
        {
          creation_id: response.data.id,
          access_token: this.accessToken,
        }
      )

      return { success: true, data: publishResponse.data }
    } catch (error) {
      console.error('Threads API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Threads投稿に失敗しました' 
      }
    }
  }

  async getUserInfo(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await axios.get(
        `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${this.accessToken}`
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Threads API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'ユーザー情報の取得に失敗しました' 
      }
    }
  }
}