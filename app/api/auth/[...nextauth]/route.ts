import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import RedditProvider from "next-auth/providers/reddit";
import TwitterProvider from "next-auth/providers/twitter";
import GoogleProvider from "next-auth/providers/google";

// Initialize Firebase credentials
let credentials;
try {
  credentials = process.env.GCP_CREDENTIALS
    ? JSON.parse(process.env.GCP_CREDENTIALS)
    : null;

  if (!credentials || !credentials.project_id) {
    throw new Error("Invalid or missing GCP credentials: project_id is required");
  }

  if (process.env.GCP_PROJECT_ID && process.env.GCP_PROJECT_ID !== credentials.project_id) {
    throw new Error("GCP_PROJECT_ID does not match credentials.project_id");
  }
} catch (error) {
  console.error("Failed to load Firebase credentials:", error);
  throw new Error("Firebase credentials are not properly configured");
}

// Build-time check to skip execution during next build
if (
  process.env.NODE_ENV === "production" &&
  (!process.env.GCP_CREDENTIALS || !process.env.GCP_PROJECT_ID)
) {
  console.warn("Skipping NextAuth initialization during build due to missing environment variables");
  // Export a dummy handler to prevent build failure
  export const GET = () =>
    new Response("Skipped during build", { status: 500 });
  export const POST = () =>
    new Response("Skipped during build", { status: 500 });
} else {
  // Proceed with NextAuth configuration
  export const authOptions = {
    providers: [
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: process.env.EMAIL_SERVER_PORT,
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: process.env.EMAIL_FROM,
      }),
      RedditProvider({
        clientId: process.env.REDDIT_CLIENT_ID,
        clientSecret: process.env.REDDIT_CLIENT_SECRET,
        authorization: {
          params: {
            duration: "permanent",
            scope: "identity history save",
          },
        },
      }),
      TwitterProvider({
        clientId: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        version: "2.0",
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            scope: "https://www.googleapis.com/auth/youtube.readonly email",
          },
        },
      }),
    ],
    adapter: FirestoreAdapter({
      credential: cert(credentials),
    }),
    callbacks: {
      async session({ session, user }) {
        // Add user ID to session
        session.user.id = user.id;
        return session;
      },
      async jwt({ token, account }) {
        // Store the OAuth tokens in the JWT
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.provider = account.provider;
        }
        return token;
      },
    },
    pages: {
      signIn: "/auth/signin",
      error: "/auth/error",
    },
    session: {
      strategy: "jwt",
    },
  };

  const handler = NextAuth(authOptions);
  export { handler as GET, handler as POST };
}
