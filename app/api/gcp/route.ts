import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

// This route demonstrates connecting to GCP using OIDC
export async function GET() {
  // Verify the user is authorized
  const session = await getServerSession(authOptions)

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    // Get the GCP token using OIDC
    const token = await getGCPToken()

    // Use the token to access GCP resources
    const storage = await listGCPStorageBuckets(token)

    return NextResponse.json({
      success: true,
      buckets: storage.buckets,
    })
  } catch (error) {
    console.error("Failed to access GCP:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function getGCPToken() {
  // This function demonstrates how to get a GCP token using OIDC [^3]
  // In a real implementation, you would use the GCP SDK

  // Define the GCP OIDC token endpoint
  const tokenUrl = `https://sts.googleapis.com/v1/token`

  // Get the OIDC token from Vercel
  const oidcToken = await fetch("https://oidc.vercel.com/token", {
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
    },
  }).then((res) => res.text())

  // Exchange the OIDC token for a GCP token
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audience:
        "//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel/providers/vercel",
      grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
      requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
      scope: "https://www.googleapis.com/auth/cloud-platform",
      subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
      subjectToken: oidcToken,
    }),
  })

  const data = await response.json()
  return data.access_token
}

async function listGCPStorageBuckets(token: string) {
  // This function demonstrates how to use a GCP token to access GCP resources
  const projectId = process.env.GCP_PROJECT_ID
  const url = `https://storage.googleapis.com/storage/v1/b?project=${projectId}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return await response.json()
}
