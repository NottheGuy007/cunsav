import type { SavedContent, UserPlatformConnection } from "@/lib/types"
import { refreshYoutubeToken } from "./youtube-oauth"

export async function fetchYoutubeSavedContent(connection: UserPlatformConnection): Promise<SavedContent[]> {
  // Check if token needs refresh
  const now = new Date()
  if (now >= connection.expires_at) {
    const refreshedTokens = await refreshYoutubeToken(connection.refresh_token)
    // Update connection with new tokens (this would be handled by the sync engine)
    connection.access_token = refreshedTokens.access_token
    connection.expires_at = new Date(Date.now() + refreshedTokens.expires_in * 1000)
  }

  // Fetch saved videos from YouTube
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=LL",
    {
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Transform YouTube data to unified format
  return (data.items || []).map((item: any) => {
    const snippet = item.snippet
    const videoId = item.contentDetails.videoId

    return {
      user_id: connection.user_id,
      item_id: `youtube_${videoId}`,
      platform: "youtube",
      title: snippet.title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      content_type: "video",
      saved_at: new Date(snippet.publishedAt),
      reminder_flag: false,
      reminder_time: null,
      content_preview: snippet.description,
      thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      metadata: {
        channel_title: snippet.channelTitle,
        channel_id: snippet.channelId,
        position: snippet.position,
      },
    } as Omit<SavedContent, "id">
  })
}
