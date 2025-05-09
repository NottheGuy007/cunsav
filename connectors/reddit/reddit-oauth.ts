export async function refreshRedditToken(refreshToken: string) {
  const basicAuth = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString(
    "base64",
  )

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    throw new Error(`Reddit token refresh failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  }
}
