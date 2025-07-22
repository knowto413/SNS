import axios from 'axios'

export class NoteService {
  private apiKey: string
  private baseUrl = 'https://note.com/api/v2'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async postArticle(title: string, content: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/notes`,
        {
          note: {
            name: title,
            body: content,
            status: 'published',
            publish_at: new Date().toISOString(),
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          }
        }
      )

      return { success: true, data: response.data }
    } catch (error) {
      console.error('Note API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'note投稿に失敗しました' 
      }
    }
  }

  async getUserInfo(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/user`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          }
        }
      )
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Note API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'ユーザー情報の取得に失敗しました' 
      }
    }
  }
}