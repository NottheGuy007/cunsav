import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { importFromExternalFirebase } from "@/lib/firebase-wrapper"

// This route allows importing data from an external Firebase instance
export async function POST(request: Request, { params }: { params: { userId: string } }) {
  // Verify the user is authorized
  const session = await getServerSession(authOptions)

  if (!session || session.user.id !== params.userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { serviceAccountKey, projectId } = await request.json()

    // Validate the inputs
    if (!serviceAccountKey || !projectId) {
      return NextResponse.json(
        { success: false, error: "Service account key and project ID are required" },
        { status: 400 },
      )
    }

    // Import from external Firebase
    const result = await importFromExternalFirebase(params.userId, serviceAccountKey, projectId)

    return NextResponse.json(result)
  } catch (error) {
    console.error(`Failed to import from Firebase for user ${params.userId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
