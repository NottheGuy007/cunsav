import { getSavedContentForReminders, updateReminderLogStatus, createReminderLog } from "@/lib/db"
import { getFirebaseAdmin } from "@/lib/firebase"
import type { SavedContent } from "@/lib/types"
import nodemailer from "nodemailer"

export async function processReminders() {
  const now = new Date()
  console.log(`Processing reminders at ${now.toISOString()}`)

  // Get all content items that need reminders
  const reminders = await getSavedContentForReminders(now)

  for (const content of reminders) {
    // Create a reminder log
    const reminderLogId = await createReminderLog({
      user_id: content.user_id,
      content_id: content.id,
      scheduled_time: now,
      sent_time: null,
      status: "pending",
    })

    try {
      // Send the reminder
      await sendReminderEmail(content)

      // Update the reminder log
      await updateReminderLogStatus(reminderLogId, "sent", new Date())
    } catch (error) {
      console.error(`Failed to send reminder for content ${content.id}:`, error)

      // Update the reminder log with the error
      await updateReminderLogStatus(
        reminderLogId,
        "failed",
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      )
    }
  }
}

async function sendReminderEmail(content: SavedContent) {
  // Get the user's email
  const { auth } = getFirebaseAdmin()
  const user = await auth.getUser(content.user_id)

  if (!user.email) {
    throw new Error(`User ${content.user_id} has no email address`)
  }

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: true,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })

  // Send the email
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Reminder: ${content.title}`,
    html: `
      <h1>Here's your reminder</h1>
      <p>You asked to be reminded about this content:</p>
      <h2>${content.title}</h2>
      <p>${content.content_preview}</p>
      <p><a href="${content.url}">View on ${content.platform}</a></p>
    `,
  })
}
