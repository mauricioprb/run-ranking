import { redirect } from "next/navigation";

export async function GET() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
  const scope = "read,activity:read_all";

  if (!clientId) {
    return new Response("STRAVA_CLIENT_ID não configurado", { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    approval_prompt: "force",
    scope: scope,
  });

  redirect(`https://www.strava.com/oauth/authorize?${params.toString()}`);
}
