import { NextResponse } from "next/server";
import { getSavedContentByUser } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// This route allows fetching a user's saved content
export async function GET(request, { params }) {
  // Prevent execution during Next.js build if credentials are missing
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.GCP_CREDENTIALS || !process.env.GCP_PROJECT_ID)
  ) {
    console.warn("Skipping user content API route during build due to missing environment variables");
    return NextResponse.json(
      { success: false, error: "GCP credentials or project ID not configured" },
      { status: 500 }
    );
  }

  // Verify the user is authorized to access this content
  const session = await getServerSession(authOptions);
  if (!session || session.user.id !== params.userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Get the user's saved content
    const content = await getSavedContentByUser(params.userId);

    // Apply any filters from query parameters
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const contentType = searchParams.get("contentType");

    let filteredContent = content;

    if (platform) {
      filteredContent = filteredContent.filter((item) => item.platform === platform);
    }

    if (contentType) {
      filteredContent = filteredContent.filter((item) => item.content_type === contentType);
    }

    return NextResponse.json({
      success: true,
      content: filteredContent,
    });
  } catch (error) {
    console.error(`Failed to get content for user ${params.userId}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
