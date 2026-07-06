import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userEmail = (url.searchParams.get("userEmail") || "").trim().toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail wajib diisi." }, { status: 400 });
    }

    const rows = await prisma.ikuTarget.findMany({
      where: { userEmail }
    });

    const targets: Record<string, number> = {};
    rows.forEach((row) => {
      targets[row.ikuCode] = row.target;
    });

    return NextResponse.json({ targets });
  } catch (error) {
    console.error("GET /api/iku-targets error:", error);
    return NextResponse.json({ error: "Gagal memuat target IKU dari database." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userEmail?: string;
      targets?: Record<string, number>;
    };

    const userEmail = (body.userEmail || "").trim().toLowerCase();
    const targets = body.targets;

    if (!userEmail || !targets || typeof targets !== "object") {
      return NextResponse.json({ error: "Data tidak lengkap atau tidak valid." }, { status: 400 });
    }

    const operations = Object.entries(targets).map(([ikuCode, target]) => {
      return prisma.ikuTarget.upsert({
        where: {
          userEmail_ikuCode: {
            userEmail,
            ikuCode
          }
        },
        update: {
          target: Number(target),
          updatedAt: new Date()
        },
        create: {
          userEmail,
          ikuCode,
          target: Number(target)
        }
      });
    });

    await Promise.all(operations);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/iku-targets error:", error);
    return NextResponse.json({ error: "Gagal menyimpan target IKU ke database." }, { status: 500 });
  }
}
