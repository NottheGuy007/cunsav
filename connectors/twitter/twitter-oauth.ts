export async function refreshTwitterToken(refreshToken: string) {
  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.TWITTER_CLIENT_ID!,
      client_secret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  })

  if (!response.ok) {
    throw new Error(`Twitter token refresh failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  }
}
