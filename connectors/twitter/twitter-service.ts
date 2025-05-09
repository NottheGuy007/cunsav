import type { SavedContent, UserPlatformConnection } from "@/lib/types"
import { refreshTwitterToken } from "./twitter-oauth"

export async function fetchTwitterSavedContent(connection: UserPlatformConnection): Promise<SavedContent[]> {
  // Check if token needs refresh
  const now = new Date()
  if (now >= connection.expires_at) {
    const refreshedTokens = await refreshTwitterToken(connection.refresh_token)
    // Update connection with new tokens (this would be handled by the sync engine)
    connection.access_token = refreshedTokens.access_token
    connection.expires_at = new Date(Date.now() + refreshedTokens.expires_in * 1000)
  }

  // Fetch bookmarked tweets
  const response = await fetch(
    "https://api.twitter.com/2/users/me/bookmarks?expansions=author_id&tweet.fields=created_at,text,entities,public_metrics&user.fields=name,username,profile_image_url",
    {
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Transform Twitter data to unified format
  return (data.data || []).map((tweet: any) => {
    const author = data.includes?.users?.find((user: any) => user.id === tweet.author_id)

    return {
      user_id: connection.user_id,
      item_id: `twitter_${tweet.id}`,
      platform: "twitter",
      title: `Tweet by @${author?.username || "unknown"}`,
      url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
      content_type: "tweet",
      saved_at: new Date(tweet.created_at),
      reminder_flag: false,
      reminder_time: null,
      content_preview: tweet.text,
      thumbnail_url: author?.profile_image_url,
      metadata: {
        author_name: author?.name,
        author_username: author?.username,
        retweet_count: tweet.public_metrics?.retweet_count,
        like_count: tweet.public_metrics?.like_count,
        reply_count: tweet.public_metrics?.reply_count,
      },
    } as Omit<SavedContent, "id">
  })
}
