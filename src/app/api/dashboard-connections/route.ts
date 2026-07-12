import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const dashboardConnectionSelect = {
  id: true,
  userEmail: true,
  dashboardTab: true,
  sourceId: true,
  sourceLabel: true,
  createdAt: true,
  updatedAt: true
} as const;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userEmail = (url.searchParams.get("userEmail") || "").trim().toLowerCase();
    const dashboardTab = (url.searchParams.get("dashboardTab") || "").trim();

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail wajib diisi." }, { status: 400 });
    }

    const user = await prisma.appUser.findUnique({ where: { email: userEmail } });
    if (user && !user.isActive) {
      return NextResponse.json({ error: "Akun Anda telah dinonaktifkan. Silakan hubungi admin." }, { status: 403 });
    }

    if (dashboardTab) {
      const row = await prisma.dashboardTabConnection.findUnique({
        select: dashboardConnectionSelect,
        where: {
          userEmail_dashboardTab: {
            userEmail,
            dashboardTab
          }
        }
      });
      return NextResponse.json({ connection: row ?? null });
    }

    const rows = await prisma.dashboardTabConnection.findMany({
      select: dashboardConnectionSelect,
      where: { userEmail },
      orderBy: { dashboardTab: "asc" }
    });

    return NextResponse.json({ connections: rows });
  } catch {
    return NextResponse.json({ error: "Gagal memuat koneksi dashboard." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      userEmail?: string;
      dashboardTab?: string;
      sourceId?: string;
      sourceLabel?: string;
    };

    const userEmail = (body.userEmail || "").trim().toLowerCase();
    const dashboardTab = (body.dashboardTab || "").trim();
    const sourceId = (body.sourceId || "").trim();
    const sourceLabel = (body.sourceLabel || "").trim();

    if (!userEmail || !dashboardTab || !sourceId || !sourceLabel) {
      return NextResponse.json({ error: "Data koneksi dashboard tidak lengkap." }, { status: 400 });
    }

    const upserted = await prisma.dashboardTabConnection.upsert({
      select: dashboardConnectionSelect,
      where: {
        userEmail_dashboardTab: {
          userEmail,
          dashboardTab
        }
      },
      update: {
        sourceId,
        sourceLabel,
        updatedAt: new Date()
      },
      create: {
        userEmail,
        dashboardTab,
        sourceId,
        sourceLabel
      }
    });

    return NextResponse.json({ ok: true, connection: upserted });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan koneksi dashboard." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const userEmail = (url.searchParams.get("userEmail") || "").trim().toLowerCase();
    const dashboardTab = (url.searchParams.get("dashboardTab") || "").trim();

    if (!userEmail || !dashboardTab) {
      return NextResponse.json({ error: "userEmail dan dashboardTab wajib diisi." }, { status: 400 });
    }

    await prisma.dashboardTabConnection.delete({
      where: {
        userEmail_dashboardTab: {
          userEmail,
          dashboardTab
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mencabut koneksi dashboard." }, { status: 500 });
  }
}
