import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getFirebaseAdmin } from "@/lib/firebase"

// This route allows setting a reminder for a content item
export async function POST(request: Request, { params }: { params: { userId: string; contentId: string } }) {
  // Verify the user is authorized
  const session = await getServerSession(authOptions)

  if (!session || session.user.id !== params.userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { reminderTime } = await request.json()

    // Validate the reminder time
    if (!reminderTime) {
      return NextResponse.json({ success: false, error: "Reminder time is required" }, { status: 400 })
    }

    // Parse the reminder time
    const reminderDate = new Date(reminderTime)

    // Update the content item with the reminder
    const { db } = getFirebaseAdmin()
    await db.collection("saved_content").doc(params.contentId).update({
      reminder_flag: true,
      reminder_time: reminderDate,
      updated_at: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Failed to set reminder for content ${params.contentId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// This route allows removing a reminder for a content item
export async function DELETE(request: Request, { params }: { params: { userId: string; contentId: string } }) {
  // Verify the user is authorized
  const session = await getServerSession(authOptions)

  if (!session || session.user.id !== params.userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Update the content item to remove the reminder
    const { db } = getFirebaseAdmin()
    await db.collection("saved_content").doc(params.contentId).update({
      reminder_flag: false,
      reminder_time: null,
      updated_at: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Failed to remove reminder for content ${params.contentId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
