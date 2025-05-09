import { getFirebaseAdmin } from "./firebase"
import type { SavedContent } from "./types"

// This is a wrapper for Firebase Firestore to handle the Firebase Wrapper extension
// for connecting to external Firebase instances [^1]
export async function importFromExternalFirebase(userId: string, serviceAccountKey: string, projectId: string) {
  const { db } = getFirebaseAdmin()

  try {
    // Store the service account key in Vault
    // Note: In a real implementation, you would use Vault to securely store the key
    // For demonstration, we'll just log the action
    console.log(`Would store service account key for project ${projectId} in Vault`)

    // Create a foreign server for the external Firebase
    await db.query(`
      CREATE SERVER firebase_server
      FOREIGN DATA WRAPPER firebase_wrapper
      OPTIONS (
        sa_key_id 'key_123',
        project_id '${projectId}'
      );
    `)

    // Create a schema for the foreign tables
    await db.query(`
      CREATE SCHEMA IF NOT EXISTS firebase;
    `)

    // Create foreign tables for Firebase Auth users
    await db.query(`
      CREATE FOREIGN TABLE firebase.users (
        uid text,
        email text,
        created_at timestamp,
        attrs jsonb
      )
      SERVER firebase_server
      OPTIONS (
        object 'auth/users'
      );
    `)

    // Create foreign tables for Firestore documents
    await db.query(`
      CREATE FOREIGN TABLE firebase.docs (
        name text,
        created_at timestamp,
        updated_at timestamp,
        attrs jsonb
      )
      SERVER firebase_server
      OPTIONS (
        object 'firestore/user-profiles'
      );
    `)

    // Query the foreign tables
    const users = await db.query(`SELECT * FROM firebase.users LIMIT 100;`)
    const docs = await db.query(`SELECT * FROM firebase.docs LIMIT 100;`)

    // Process the results
    const importedContent: Omit<SavedContent, "id">[] = docs.rows.map((doc: any) => {
      return {
        user_id: userId,
        item_id: `firebase_${doc.name}`,
        platform: "firebase",
        title: doc.attrs.title || "Untitled",
        url: doc.attrs.url || "",
        content_type: doc.attrs.type || "post",
        saved_at: doc.created_at,
        reminder_flag: false,
        reminder_time: null,
        content_preview: doc.attrs.content || "",
        metadata: {
          source: "external_firebase",
          project_id: projectId,
          original_data: doc.attrs,
        },
      }
    })

    // Store the imported content
    for (const content of importedContent) {
      await db.collection("saved_content").add(content)
    }

    return {
      success: true,
      imported: importedContent.length,
      users: users.rows.length,
    }
  } catch (error) {
    console.error(`Failed to import from external Firebase for user ${userId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
