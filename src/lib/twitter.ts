import { TwitterApi } from 'twitter-api-v2'

export class TwitterService {
  private client: TwitterApi

  constructor(accessToken: string) {
    this.client = new TwitterApi(accessToken)
  }

  async postTweet(text: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const tweet = await this.client.v2.tweet(text)
      return { success: true, data: tweet.data }
    } catch (error) {
      console.error('Twitter API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Twitter投稿に失敗しました' 
      }
    }
  }

  async getUserInfo(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = await this.client.v2.me()
      return { success: true, data: user.data }
    } catch (error) {
      console.error('Twitter API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'ユーザー情報の取得に失敗しました' 
      }
    }
  }
}