import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import crypto from "node:crypto";

export async function GET() {
  const state = crypto.randomUUID();
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;

  const cookieStore = await cookies();
  cookieStore.set("strava_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    approval_prompt: "force",
    scope: "read,activity:read_all",
    state,
  });

  redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
}
