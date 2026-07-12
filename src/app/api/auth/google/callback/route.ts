import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { upsertGoogleUser } from "@/lib/auth-repo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  email?: string;
  name?: string;
  picture?: string;
};

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(request.url).origin;
}

function errorRedirect(request: Request, message: string) {
  const loginUrl = new URL("/login", getBaseUrl(request));
  loginUrl.searchParams.set("google_auth", "error");
  loginUrl.searchParams.set("error", message);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return errorRedirect(request, "Parameter OAuth tidak lengkap.");
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("iku_google_oauth_state")?.value;
  cookieStore.delete("iku_google_oauth_state");

  if (!expectedState || expectedState !== state) {
    return errorRedirect(request, "State OAuth tidak valid.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return errorRedirect(request, "Google OAuth belum dikonfigurasi di server.");
  }

  const redirectUri = `${getBaseUrl(request)}/api/auth/google/callback`;

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const tokenJson = (await tokenResp.json()) as GoogleTokenResponse;
  if (!tokenResp.ok || !tokenJson.access_token) {
    const msg = tokenJson.error_description || tokenJson.error || "Gagal menukar authorization code.";
    return errorRedirect(request, msg);
  }

  const userInfoResp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`
    }
  });

  const userInfo = (await userInfoResp.json()) as GoogleUserInfo;
  if (!userInfoResp.ok || !userInfo.email) {
    return errorRedirect(request, "Gagal mengambil profil Google.");
  }

  try {
    const session = await upsertGoogleUser({
      name: userInfo.name || userInfo.email.split("@")[0],
      email: userInfo.email,
      avatarUrl: userInfo.picture || ""
    });

    const loginUrl = new URL("/login", getBaseUrl(request));
    loginUrl.searchParams.set("google_auth", "success");

    const response = NextResponse.redirect(loginUrl);
    response.cookies.set("iku_oauth_session", JSON.stringify(session), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60
    });

    return response;
  } catch (error: any) {
    if (error?.message === "USER_DEACTIVATED") {
      return errorRedirect(request, "Akun Google Anda telah dinonaktifkan. Silakan hubungi admin.");
    }
    return errorRedirect(request, "Gagal mengautentikasi pengguna Google.");
  }
}
