import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; isActive?: boolean };
    const email = (body.email || "").trim().toLowerCase();
    const isActive = body.isActive !== false; // defaults to true if not explicitly false

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }

    const updated = await prisma.appUser.update({
      where: { email },
      data: { isActive, updatedAt: new Date() }
    });

    return NextResponse.json({ ok: true, email: updated.email, isActive: updated.isActive });
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal memperbarui status aktif user." }, { status: 500 });
  }
}
