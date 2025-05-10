import { Firestore } from "@google-cloud/firestore";

// Initialize Firestore with service account credentials
let db;
try {
  const credentials = process.env.GCP_CREDENTIALS
    ? JSON.parse(process.env.GCP_CREDENTIALS)
    : null;

  if (!credentials || !credentials.project_id) {
    throw new Error("Invalid or missing GCP credentials: project_id is required");
  }

  if (process.env.GCP_PROJECT_ID && process.env.GCP_PROJECT_ID !== credentials.project_id) {
    throw new Error("GCP_PROJECT_ID does not match credentials.project_id");
  }

  db = new Firestore({ credentials });
} catch (error) {
  console.error("Failed to initialize Firestore:", error);
  throw new Error("Firestore credentials are not properly configured");
}

// Fetch saved content for a user
export async function getSavedContentByUser(userId) {
  // Skip execution during build if credentials are missing
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.GCP_CREDENTIALS || !process.env.GCP_PROJECT_ID)
  ) {
    throw new Error("Skipping database query during build: GCP credentials or project ID not configured");
  }

  try {
    const collectionRef = db.collection("userContent").doc(userId).collection("content");
    const snapshot = await collectionRef.get();
    const content = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return content;
  } catch (error) {
    console.error(`Failed to fetch content for user ${userId}:`, error);
    throw error;
  }
}
