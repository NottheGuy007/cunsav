import { NextResponse } from "next/server"
import { syncUserContent } from "@/sync/sync-engine"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// This route allows manual triggering of a sync for a user
export async function POST(request: Request, { params }: { params: { userId: string } }) {
  // Verify the user is authorized to sync this account
  const session = await getServerSession(authOptions)

  if (!session || session.user.id !== params.userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Run the sync for this user
    await syncUserContent(params.userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Sync failed for user ${params.userId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
