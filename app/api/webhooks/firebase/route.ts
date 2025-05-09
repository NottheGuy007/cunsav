import { NextResponse } from "next/server"
import { syncUserContent } from "@/sync/sync-engine"

// This route would be called by Firebase Auth triggers
export async function POST(request: Request) {
  // Verify the request is from Firebase (e.g., check for a secret token)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.FIREBASE_WEBHOOK_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const data = await request.json()

    // Handle different event types
    if (data.event === "user.created") {
      // A new user was created
      console.log("New user created:", data.user.uid)
    } else if (data.event === "user.deleted") {
      // A user was deleted
      console.log("User deleted:", data.user.uid)
      // Clean up user data
    } else if (data.event === "account.linked") {
      // A user linked a new platform account
      console.log("User linked account:", data.user.uid, data.platform)
      // Trigger an immediate sync for the new platform
      await syncUserContent(data.user.uid)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Firebase webhook failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
