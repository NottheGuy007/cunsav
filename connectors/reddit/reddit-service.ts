import type { SavedContent, UserPlatformConnection } from "@/lib/types"
import { refreshRedditToken } from "./reddit-oauth"

export async function fetchRedditSavedContent(connection: UserPlatformConnection): Promise<SavedContent[]> {
  // Check if token needs refresh
  const now = new Date()
  if (now >= connection.expires_at) {
    const refreshedTokens = await refreshRedditToken(connection.refresh_token)
    // Update connection with new tokens (this would be handled by the sync engine)
    connection.access_token = refreshedTokens.access_token
    connection.expires_at = new Date(Date.now() + refreshedTokens.expires_in * 1000)
  }

  // Fetch saved posts from Reddit
  const response = await fetch("https://oauth.reddit.com/user/me/saved?limit=100", {
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
      "User-Agent": "UnifiedSave/1.0",
    },
  })

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Transform Reddit data to unified format
  return data.data.children.map((item: any) => {
    const isPost = item.kind === "t3"
    const isComment = item.kind === "t1"
    const data = item.data

    return {
      user_id: connection.user_id,
      item_id: `reddit_${data.id}`,
      platform: "reddit",
      title: isPost ? data.title : data.link_title || "Comment",
      url: `https://reddit.com${isPost ? data.permalink : data.link_permalink}`,
      content_type: isPost ? "post" : "comment",
      saved_at: new Date(data.created_utc * 1000),
      reminder_flag: false,
      reminder_time: null,
      content_preview: data.selftext || data.body || "",
      thumbnail_url: isPost && data.thumbnail && data.thumbnail !== "self" ? data.thumbnail : undefined,
      metadata: {
        subreddit: data.subreddit,
        author: data.author,
        score: data.score,
        num_comments: isPost ? data.num_comments : undefined,
      },
    } as Omit<SavedContent, "id">
  })
}
