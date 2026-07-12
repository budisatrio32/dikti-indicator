import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SheetConnection } from "@/lib/source-connection-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RawConnectionFile = {
  id: string;
  name: string;
  url: string;
};

type RawConnectionInput = {
  id?: unknown;
  type?: unknown;
  name?: unknown;
  url?: unknown;
  files?: unknown;
};

type SourceTransactionClient = Pick<typeof prisma, "dataSourceConnection">;

const dataSourceConnectionSelect = {
  id: true,
  type: true,
  name: true,
  url: true,
  files: true
} as const;

function isRawConnectionFile(value: unknown): value is RawConnectionFile {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "name" in value &&
      "url" in value &&
      typeof value.id === "string" &&
      typeof value.name === "string" &&
      typeof value.url === "string"
  );
}

function normalizeConnection(input: RawConnectionInput | null | undefined): SheetConnection | null {
  if (!input || typeof input !== "object") return null;
  if (!input.id || !input.name || !input.url || !input.type) return null;
  if (input.type !== "sheet" && input.type !== "folder") return null;

  const files = Array.isArray(input.files)
    ? input.files
        .filter((file): file is RawConnectionFile => isRawConnectionFile(file))
        .map((file) => ({ id: file.id, name: file.name, url: file.url }))
    : undefined;

  return {
    id: String(input.id),
    type: input.type,
    name: String(input.name),
    url: String(input.url),
    files
  };
}

function filesEqual(left?: SheetConnection["files"], right?: SheetConnection["files"]) {
  if (!left?.length && !right?.length) return true;
  if (!left || !right || left.length !== right.length) return false;

  return left.every((file, index) => {
    const other = right[index];
    return other && file.id === other.id && file.name === other.name && file.url === other.url;
  });
}

function connectionsEqual(
  existing: Pick<SheetConnection, "type" | "name" | "url" | "files">,
  incoming: SheetConnection
) {
  return (
    existing.type === incoming.type &&
    existing.name === incoming.name &&
    existing.url === incoming.url &&
    filesEqual(existing.files, incoming.files)
  );
}

function toSheetConnection(row: {
  id: string;
  type: string;
  name: string;
  url: string;
  files: unknown;
}): SheetConnection | null {
  return normalizeConnection({
    id: row.id,
    type: row.type,
    name: row.name,
    url: row.url,
    files: Array.isArray(row.files) ? row.files : undefined
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userEmail = (url.searchParams.get("userEmail") || "").trim().toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail wajib diisi." }, { status: 400 });
    }

    const user = await prisma.appUser.findUnique({ where: { email: userEmail } });
    if (user && !user.isActive) {
      return NextResponse.json({ error: "Akun Anda telah dinonaktifkan. Silakan hubungi admin." }, { status: 403 });
    }

    const rows = await prisma.dataSourceConnection.findMany({
      where: { userEmail },
      select: dataSourceConnectionSelect,
      orderBy: { createdAt: "asc" }
    });

    const connections: SheetConnection[] = rows
      .map((row) => toSheetConnection(row))
      .filter((item: SheetConnection | null): item is SheetConnection => Boolean(item));

    return NextResponse.json({ connections });
  } catch {
    return NextResponse.json({ error: "Gagal memuat source connections." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userEmail?: string;
      connections?: RawConnectionInput[];
    };

    const userEmail = (body.userEmail || "").trim().toLowerCase();
    const rawConnections = Array.isArray(body.connections) ? body.connections : [];

    if (!userEmail) {
      return NextResponse.json({ error: "userEmail wajib diisi." }, { status: 400 });
    }

    const connections = rawConnections
      .map((item) => normalizeConnection(item))
      .filter((item: SheetConnection | null): item is SheetConnection => Boolean(item));

    const existingRows = await prisma.dataSourceConnection.findMany({
      where: { userEmail },
      select: dataSourceConnectionSelect
    });

    const existingConnections = new Map(
      existingRows
        .map((row) => toSheetConnection(row))
        .filter((item: SheetConnection | null): item is SheetConnection => Boolean(item))
        .map((connection) => [connection.id, connection])
    );

    const incomingIds = new Set(connections.map((connection) => connection.id));
    const deleteIds = existingRows
      .map((row) => row.id)
      .filter((id) => !incomingIds.has(id));

    const createData = connections
      .filter((connection) => !existingConnections.has(connection.id))
      .map((connection) => ({
        id: connection.id,
        userEmail,
        type: connection.type,
        name: connection.name,
        url: connection.url,
        files: connection.files
      }));

    const updateOperations = connections
      .filter((connection) => {
        const existing = existingConnections.get(connection.id);
        return existing && !connectionsEqual(existing, connection);
      })
      .map((connection) =>
        prisma.dataSourceConnection.update({
          where: { id: connection.id },
          data: {
            type: connection.type,
            name: connection.name,
            url: connection.url,
            files: connection.files,
            updatedAt: new Date()
          }
        })
      );

    if (deleteIds.length > 0) {
      await prisma.dataSourceConnection.deleteMany({
        where: {
          userEmail,
          id: { in: deleteIds }
        }
      });
    }

    if (createData.length > 0) {
      await prisma.dataSourceConnection.createMany({
        data: createData
      });
    }

    if (updateOperations.length > 0) {
      await Promise.all(updateOperations);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan source connections." }, { status: 500 });
  }
}
