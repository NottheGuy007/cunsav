import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Storage } from "@google-cloud/storage";

// Initialize GCP Storage with service account credentials
let credentials;
try {
  credentials = process.env.GCP_CREDENTIALS
    ? JSON.parse(process.env.GCP_CREDENTIALS)
    : null;
  if (!credentials || !credentials.project_id) {
    throw new Error("Invalid or missing GCP credentials");
  }
} catch (error) {
  console.error("Failed to load GCP credentials:", error);
  throw new Error("GCP credentials are not properly configured");
}

const storage = new Storage({ credentials });

export async function GET() {
  // Skip execution during build if in production and credentials are missing
  if (process.env.NODE_ENV === "production" && !credentials) {
    return NextResponse.json(
      { success: false, error: "GCP credentials not configured" },
      { status: 500 }
    );
  }

  // Verify the user is authorized
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // List GCP Storage buckets
    const [buckets] = await storage.getBuckets();

    return NextResponse.json({
      success: true,
      buckets: buckets.map((bucket) => bucket.name),
    });
  } catch (error) {
    console.error("Failed to access GCP:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
