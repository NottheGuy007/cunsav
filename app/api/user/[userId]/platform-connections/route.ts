import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getUserPlatformConnections } from "@/lib/db"

// This route allows fetching a user's platform connections
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  // Verify the user is authorized
  const session = await getServerSession(authOptions)

  if (!session || session.user.id !== params.userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Get the user's platform connections
    const connections = await getUserPlatformConnections(params.userId)

    // Remove sensitive information
    const sanitizedConnections = connections.map((conn) => ({
      id: conn.id,
      platform: conn.platform,
      last_sync: conn.last_sync,
      is_active: conn.is_active,
    }))

    return NextResponse.json({
      success: true,
      connections: sanitizedConnections,
    })
  } catch (error) {
    console.error(`Failed to get platform connections for user ${params.userId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
