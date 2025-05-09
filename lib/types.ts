export type Platform = "reddit" | "twitter" | "youtube"

export type ContentType = "post" | "tweet" | "video" | "comment"

export interface SavedContent {
  id: string
  user_id: string
  item_id: string
  platform: Platform
  title: string
  url: string
  content_type: ContentType
  saved_at: Date
  reminder_flag: boolean
  reminder_time: Date | null
  content_preview: string
  thumbnail_url?: string
  metadata: Record<string, any>
}

export interface UserPlatformConnection {
  id: string
  user_id: string
  platform: Platform
  access_token: string
  refresh_token: string
  expires_at: Date
  last_sync: Date
  is_active: boolean
}

export interface SyncLog {
  id: string
  user_id: string
  platform: Platform
  start_time: Date
  end_time: Date
  items_synced: number
  status: "success" | "failed"
  error_message?: string
}

export interface ReminderLog {
  id: string
  user_id: string
  content_id: string
  scheduled_time: Date
  sent_time: Date | null
  status: "pending" | "sent" | "failed"
  error_message?: string
}
