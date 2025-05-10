import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Storage } from "@google-cloud/storage";

// Initialize GCP Storage with service account credentials
let credentials;
try {
  // Load credentials from GCP_CREDENTIALS environment variable
  credentials = process.env.GCP_CREDENTIALS
    ? JSON.parse(process.env.GCP_CREDENTIALS)
    : null;

  // Validate credentials and project_id
  if (!credentials || !credentials.project_id) {
    throw new Error("Invalid or missing GCP credentials: project_id is required");
  }

  // Ensure GCP_PROJECT_ID environment variable matches credentials.project_id
  if (process.env.GCP_PROJECT_ID && process.env.GCP_PROJECT_ID !== credentials.project_id) {
    throw new Error("GCP_PROJECT_ID does not match credentials.project_id");
  }
} catch (error) {
  console.error("Failed to load GCP credentials:", error);
  throw new Error("GCP credentials are not properly configured");
}

// Initialize Google Cloud Storage client
const storage = new Storage({ credentials });

export async function GET() {
  // Prevent execution during Next.js build to avoid prerendering errors
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.GCP_CREDENTIALS || !process.env.GCP_PROJECT_ID)
  ) {
    console.warn("Skipping GCP API route during build due to missing environment variables");
    return NextResponse.json(
      { success: false, error: "GCP credentials or project ID not configured" },
      { status: 500 }
    );
  }

  // Verify user authentication using next-auth
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // List all GCP Storage buckets for the project
    const [buckets] = await storage.getBuckets();

    // Return bucket names in the response
    return NextResponse.json({
      success: true,
      buckets: buckets.map((bucket) => bucket.name),
    });
  } catch (error) {
    console.error("Failed to access GCP Storage:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
