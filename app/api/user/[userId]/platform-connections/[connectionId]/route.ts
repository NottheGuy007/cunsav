import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getFirebaseAdmin } from "@/lib/firebase"

// This route allows updating a platform connection
export async function PATCH(request: Request, { params }: { params: { userId: string; connectionId: string } }) {
  // Verify the user is authorized
  const session = await getServerSession(authOptions)

  if (!session || session.user.id !== params.userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { is_active } = await request.json()

    // Update the connection
    const { db } = getFirebaseAdmin()
    await db.collection("user_platform_connections").doc(params.connectionId).update({
      is_active,
      updated_at: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Failed to update platform connection ${params.connectionId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// This route allows deleting a platform connection
export async function DELETE(request: Request, { params }: { params: { userId: string; connectionId: string } }) {
  // Verify the user is authorized
  const session = await getServerSession(authOptions)

  if (!session || session.user.id !== params.userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Delete the connection
    const { db } = getFirebaseAdmin()
    await db.collection("user_platform_connections").doc(params.connectionId).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Failed to delete platform connection ${params.connectionId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
