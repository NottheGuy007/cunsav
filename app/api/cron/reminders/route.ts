import { NextResponse } from "next/server"
import { scheduledReminderCheck } from "@/reminders/reminder-scheduler"

// This route would be called by a cron job service like Vercel Cron
export async function GET(request: Request) {
  // Verify the request is authorized (e.g., check for a secret token)
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Run the scheduled reminder check
    await scheduledReminderCheck()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reminder cron job failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
