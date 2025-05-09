import { getUserPlatformConnections, createSavedContent, createSyncLog } from "@/lib/db"
import { fetchRedditSavedContent } from "@/connectors/reddit/reddit-service"
import { fetchTwitterSavedContent } from "@/connectors/twitter/twitter-service"
import { fetchYoutubeSavedContent } from "@/connectors/youtube/youtube-service"
import type { SavedContent, UserPlatformConnection } from "@/lib/types"

export async function syncUserContent(userId: string) {
  // Get all active platform connections for the user
  const connections = await getUserPlatformConnections(userId)

  // For each platform, fetch and store content
  for (const connection of connections) {
    const startTime = new Date()
    let status: "success" | "failed" = "success"
    let errorMessage: string | undefined
    let itemsSynced = 0

    try {
      // Fetch content based on platform
      const savedContent = await fetchContentForPlatform(connection)

      // Store each content item
      for (const content of savedContent) {
        await createSavedContent(content)
        itemsSynced++
      }

      // Update last sync time for the connection
      // This would be handled by updating the connection in the database
    } catch (error) {
      status = "failed"
      errorMessage = error instanceof Error ? error.message : "Unknown error"
      console.error(`Sync failed for user ${userId} on platform ${connection.platform}:`, error)
    }

    // Log the sync operation
    const endTime = new Date()
    await createSyncLog({
      user_id: userId,
      platform: connection.platform,
      start_time: startTime,
      end_time: endTime,
      items_synced: itemsSynced,
      status,
      error_message: errorMessage,
    })
  }
}

async function fetchContentForPlatform(connection: UserPlatformConnection): Promise<Omit<SavedContent, "id">[]> {
  switch (connection.platform) {
    case "reddit":
      return fetchRedditSavedContent(connection)
    case "twitter":
      return fetchTwitterSavedContent(connection)
    case "youtube":
      return fetchYoutubeSavedContent(connection)
    default:
      throw new Error(`Unsupported platform: ${connection.platform}`)
  }
}
