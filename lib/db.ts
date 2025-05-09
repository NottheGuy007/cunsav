import { getFirebaseAdmin } from "./firebase"
import type { SavedContent, UserPlatformConnection, SyncLog, ReminderLog } from "./types"
import { Timestamp, FieldValue } from "firebase-admin/firestore"

const { db } = getFirebaseAdmin()

// Collections
const savedContentCol = db.collection("saved_content")
const userPlatformConnectionsCol = db.collection("user_platform_connections")
const syncLogsCol = db.collection("sync_logs")
const reminderLogsCol = db.collection("reminder_logs")

// SavedContent CRUD
export async function createSavedContent(content: Omit<SavedContent, "id">) {
  const docRef = savedContentCol.doc()
  await docRef.set({
    ...content,
    saved_at: Timestamp.fromDate(content.saved_at),
    reminder_time: content.reminder_time ? Timestamp.fromDate(content.reminder_time) : null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  })
  return docRef.id
}

export async function getSavedContentByUser(userId: string) {
  const snapshot = await savedContentCol.where("user_id", "==", userId).get()
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SavedContent[]
}

export async function getSavedContentForReminders(currentTime: Date) {
  const snapshot = await savedContentCol
    .where("reminder_flag", "==", true)
    .where("reminder_time", "<=", Timestamp.fromDate(currentTime))
    .get()

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SavedContent[]
}

// UserPlatformConnection CRUD
export async function saveUserPlatformConnection(connection: Omit<UserPlatformConnection, "id">) {
  const docRef = userPlatformConnectionsCol.doc()
  await docRef.set({
    ...connection,
    expires_at: Timestamp.fromDate(connection.expires_at),
    last_sync: Timestamp.fromDate(connection.last_sync),
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  })
  return docRef.id
}

export async function getUserPlatformConnections(userId: string) {
  const snapshot = await userPlatformConnectionsCol.where("user_id", "==", userId).where("is_active", "==", true).get()

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserPlatformConnection[]
}

// SyncLog CRUD
export async function createSyncLog(log: Omit<SyncLog, "id">) {
  const docRef = syncLogsCol.doc()
  await docRef.set({
    ...log,
    start_time: Timestamp.fromDate(log.start_time),
    end_time: Timestamp.fromDate(log.end_time),
    created_at: FieldValue.serverTimestamp(),
  })
  return docRef.id
}

// ReminderLog CRUD
export async function createReminderLog(log: Omit<ReminderLog, "id">) {
  const docRef = reminderLogsCol.doc()
  await docRef.set({
    ...log,
    scheduled_time: Timestamp.fromDate(log.scheduled_time),
    sent_time: log.sent_time ? Timestamp.fromDate(log.sent_time) : null,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  })
  return docRef.id
}

export async function updateReminderLogStatus(
  id: string,
  status: "sent" | "failed",
  sentTime?: Date,
  errorMessage?: string,
) {
  await reminderLogsCol.doc(id).update({
    status,
    sent_time: sentTime ? Timestamp.fromDate(sentTime) : null,
    error_message: errorMessage,
    updated_at: FieldValue.serverTimestamp(),
  })
}
