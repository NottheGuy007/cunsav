export async function refreshYoutubeToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    throw new Error(`YouTube token refresh failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  }
}
