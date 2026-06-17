import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const url = "https://docs.google.com/spreadsheets/d/1ZMFenZCtrx_O8WQ5vjtuXBmYPUtcsJPtZ4vb-jfYhcE/export?format=csv&gid=0";
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const text = await res.text();
    console.log("=== CSV First 3 Lines ===");
    console.log(text.split("\n").slice(0, 3).join("\n"));
  } catch (err) {
    console.error("Error fetching sheet:", err);
  }
}

main();
