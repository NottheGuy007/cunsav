import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { linkUserIdentities } from "@/lib/identity-linker"

// This route allows linking user identities by email
export async function POST(request: Request, { params }: { params: { userId: string } }) {
  // Verify the user is authorized
  const session = await getServerSession(authOptions)

  if (!session || session.user.id !== params.userId) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const { email } = await request.json()

    // Validate the email
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // Link identities
    const result = await linkUserIdentities(params.userId, email)

    return NextResponse.json(result)
  } catch (error) {
    console.error(`Failed to link identities for user ${params.userId}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
