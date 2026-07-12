import { NextResponse } from "next/server";
import { authenticateCredentials } from "@/lib/auth-repo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = (body.email || "").trim();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    }

    try {
      const user = await authenticateCredentials({ email, password });
      if (!user) {
        return NextResponse.json(
          { error: "Email atau sandi institusi salah." },
          { status: 401 }
        );
      }

      return NextResponse.json({ user });
    } catch (error: any) {
      if (error?.message === "USER_DEACTIVATED") {
        return NextResponse.json(
          { error: "Akun Anda telah dinonaktifkan. Silakan hubungi admin." },
          { status: 403 }
        );
      }
      throw error;
    }
  } catch {
    return NextResponse.json(
      { error: "Gagal memverifikasi login user dari database." },
      { status: 500 }
    );
  }
}
