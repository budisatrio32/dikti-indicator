import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("neon.tech") ? { rejectUnauthorized: false } : undefined
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool)
});

async function main() {
  try {
    const userEmail = "sugengdcahyo@gmail.com";
    const tabConns = await prisma.dashboardTabConnection.findMany({
      where: { userEmail }
    });
    console.log("=== Dashboard Tab Connections ===");
    console.log(JSON.stringify(tabConns, null, 2));

    const sourceConns = await prisma.dataSourceConnection.findMany({
      where: { userEmail }
    });
    console.log("=== Data Source Connections ===");
    console.log(JSON.stringify(sourceConns, null, 2));

  } catch (err) {
    console.error("Error checking db:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
