import { detectCanonicalKey } from "@/lib/normalization";
import { toNumber, toString } from "@/lib/utils";
import type { DashboardFilters, DataProfile, NormalizedRow, RawRow } from "@/types/data";

export function generateMockIkuData(faculty: string, year: string): { rows: RawRow[]; columns: string[] } {
  const columns = [
    "Tahun",
    "Fakultas",
    "Program Studi",
    "Jenjang",
    "Total Mahasiswa Aktif",
    "Mahasiswa Berkegiatan di Luar Prodi (MBKM)",
    "Mahasiswa Meraih Prestasi",
    "Total Mahasiswa Memenuhi IKU",
    "Persentase IKU 003",
    "Mitra Kampus/Industri",
    "Evidence"
  ];

  let programs: { name: string; degree: string }[] = [];
  if (faculty === "Teknik") {
    programs = [
      { name: "S1 Teknik Informatika", degree: "S1" },
      { name: "S1 Teknik Elektro", degree: "S1" },
      { name: "S1 Teknik Mesin", degree: "S1" },
      { name: "S1 Teknik Sipil", degree: "S1" },
      { name: "S1 Teknik Kimia", degree: "S1" },
      { name: "S1 Teknik Industri", degree: "S1" },
      { name: "S2 Teknik Informatika", degree: "S2" },
      { name: "S2 Teknik Mesin", degree: "S2" }
    ];
  } else if (faculty === "MIPA") {
    programs = [
      { name: "S1 Matematika", degree: "S1" },
      { name: "S1 Fisika", degree: "S1" },
      { name: "S1 Kimia", degree: "S1" },
      { name: "S1 Biologi", degree: "S1" },
      { name: "S1 Statistika", degree: "S1" },
      { name: "S2 Kimia", degree: "S2" }
    ];
  } else if (faculty === "Ekonomi") {
    programs = [
      { name: "S1 Manajemen", degree: "S1" },
      { name: "S1 Akuntansi", degree: "S1" },
      { name: "S1 Ekonomi Pembangunan", degree: "S1" },
      { name: "S2 Manajemen", degree: "S2" },
      { name: "S2 Akuntansi", degree: "S2" }
    ];
  } else {
    programs = [
      { name: "S1 Kedokteran", degree: "S1" },
      { name: "S1 Farmasi", degree: "S1" },
      { name: "S1 Psikologi", degree: "S1" }
    ];
  }

  const partnersList = [
    "Google Indonesia, Microsoft Research",
    "PT Telkom Tbk, GoTo Group",
    "PT Astra International, Siemens",
    "Huawei Tech, Tokopedia",
    "Pertamina, Chevron Pacific",
    "Kementerian BUMN, Bank Mandiri"
  ];

  const rows: RawRow[] = programs.map((prog, idx) => {
    // Fully deterministic values based on program index and faculty name
    // to prevent server-client hydration mismatches during SSR.
    const seed = idx + faculty.length;
    const total = 120 + (seed % 80); // Deterministic total: 120 to 199
    const mbkm = Math.floor(total * (0.35 + ((seed * 3) % 7) * 0.05)); // 35% to 65%
    const prestasi = Math.floor(total * (0.05 + ((seed * 5) % 5) * 0.03)); // 5% to 17%
    const ikuTotal = Math.min(total, mbkm + prestasi);
    const ikuPct = Math.round((ikuTotal / total) * 10000) / 100;

    return {
      "Tahun": year,
      "Fakultas": faculty,
      "Program Studi": prog.name,
      "Jenjang": prog.degree,
      "Total Mahasiswa Aktif": total,
      "Mahasiswa Berkegiatan di Luar Prodi (MBKM)": mbkm,
      "Mahasiswa Meraih Prestasi": prestasi,
      "Total Mahasiswa Memenuhi IKU": ikuTotal,
      "Persentase IKU 003": ikuPct,
      "Mitra Kampus/Industri": partnersList[idx % partnersList.length],
      "Evidence": `SK_Dekan_${faculty}_${prog.name.replace(/\s+/g, "_")}_${year}.pdf`
    };
  });

  return { rows, columns };
}

export function generateMockIku001Data(faculty: string): { rows: RawRow[]; columns: string[] } {
  const columns = [
    "Tahun",
    "Fakultas",
    "Jenjang",
    "Program Studi",
    "Mahasiswa Masuk",
    "Lulus Tepat Waktu"
  ];

  let programs: { name: string; degree: string }[] = [];
  if (faculty === "Teknik") {
    programs = [
      { name: "S1 Teknik Informatika", degree: "S1" },
      { name: "S1 Teknik Elektro", degree: "S1" },
      { name: "S1 Teknik Mesin", degree: "S1" },
      { name: "S1 Teknik Sipil", degree: "S1" },
      { name: "S1 Teknik Kimia", degree: "S1" },
      { name: "S1 Teknik Industri", degree: "S1" }
    ];
  } else if (faculty === "MIPA") {
    programs = [
      { name: "S1 Matematika", degree: "S1" },
      { name: "S1 Fisika", degree: "S1" },
      { name: "S1 Kimia", degree: "S1" },
      { name: "S1 Biologi", degree: "S1" },
      { name: "S1 Statistika", degree: "S1" }
    ];
  } else if (faculty === "Ekonomi") {
    programs = [
      { name: "S1 Manajemen", degree: "S1" },
      { name: "S1 Akuntansi", degree: "S1" },
      { name: "S1 Ekonomi Pembangunan", degree: "S1" }
    ];
  } else {
    programs = [
      { name: "S1 Kedokteran", degree: "S1" },
      { name: "S1 Farmasi", degree: "S1" },
      { name: "S1 Psikologi", degree: "S1" }
    ];
  }

  const rows: RawRow[] = [];
  const years = ["2024", "2025", "2026"];

  for (const yr of years) {
    programs.forEach((prog, idx) => {
      const seed = idx + faculty.length + Number(yr);
      const studentsIn = 80 + (seed % 60);
      const graduatesOnTime = Math.floor(studentsIn * (0.50 + ((seed * 7) % 8) * 0.04));

      rows.push({
        "Tahun": yr,
        "Fakultas": faculty,
        "Jenjang": prog.degree,
        "Program Studi": prog.name,
        "Mahasiswa Masuk": studentsIn,
        "Lulus Tepat Waktu": graduatesOnTime
      });
    });
  }

  return { rows, columns };
}

export function generateMockIku002Data(faculty: string): { rows: RawRow[]; columns: string[] } {
  const columns = [
    "Tahun",
    "Fakultas",
    "Prodi",
    "Jenjang",
    "Total Lulusan",
    "Responden TS",
    "Bekerja <6 bulan >1.2 UMP",
    "Bekerja <1 tahun >1.2 UMP",
    "Bekerja <1 tahun <1.2 UMP",
    "Lanjut Studi",
    "Wirausaha",
    "Belum Bekerja",
    "Tidak Terlacak"
  ];

  let programs: { name: string; degree: string }[] = [];
  if (faculty === "Teknik") {
    programs = [
      { name: "S1 Teknik Informatika", degree: "S1" },
      { name: "S1 Teknik Elektro", degree: "S1" },
      { name: "S1 Teknik Mesin", degree: "S1" },
      { name: "S1 Teknik Sipil", degree: "S1" },
      { name: "S1 Teknik Kimia", degree: "S1" },
      { name: "S1 Teknik Industri", degree: "S1" }
    ];
  } else if (faculty === "MIPA") {
    programs = [
      { name: "S1 Matematika", degree: "S1" },
      { name: "S1 Fisika", degree: "S1" },
      { name: "S1 Kimia", degree: "S1" },
      { name: "S1 Biologi", degree: "S1" },
      { name: "S1 Statistika", degree: "S1" }
    ];
  } else if (faculty === "Ekonomi") {
    programs = [
      { name: "S1 Manajemen", degree: "S1" },
      { name: "S1 Akuntansi", degree: "S1" },
      { name: "S1 Ekonomi Pembangunan", degree: "S1" }
    ];
  } else {
    programs = [
      { name: "S1 Kedokteran", degree: "S1" },
      { name: "S1 Farmasi", degree: "S1" },
      { name: "S1 Psikologi", degree: "S1" }
    ];
  }

  const rows: RawRow[] = [];
  const years = ["2024", "2025", "2026"];

  for (const yr of years) {
    programs.forEach((prog, idx) => {
      const seed = idx + faculty.length + Number(yr);
      const totalLulusan = 60 + (seed % 40);
      const respondentTs = Math.floor(totalLulusan * (0.75 + ((seed * 3) % 15) * 0.01));
      
      const work6mG = Math.floor(respondentTs * (0.35 + ((seed * 7) % 10) * 0.02));
      const work1yG = Math.floor(respondentTs * (0.10 + ((seed * 2) % 5) * 0.02));
      const work1yL = Math.floor(respondentTs * (0.05 + ((seed * 4) % 6) * 0.02));
      const study = Math.floor(respondentTs * (0.08 + ((seed * 5) % 8) * 0.02));
      const entrepreneur = Math.floor(respondentTs * (0.07 + ((seed * 9) % 7) * 0.02));
      
      const unemployed = Math.max(0, respondentTs - (work6mG + work1yG + work1yL + study + entrepreneur));
      const untracked = totalLulusan - respondentTs;

      rows.push({
        "Tahun": yr,
        "Fakultas": faculty,
        "Prodi": prog.name,
        "Jenjang": prog.degree,
        "Total Lulusan": totalLulusan,
        "Responden TS": respondentTs,
        "Bekerja <6 bulan >1.2 UMP": work6mG,
        "Bekerja <1 tahun >1.2 UMP": work1yG,
        "Bekerja <1 tahun <1.2 UMP": work1yL,
        "Lanjut Studi": study,
        "Wirausaha": entrepreneur,
        "Belum Bekerja": unemployed,
        "Tidak Terlacak": untracked
      });
    });
  }

  return { rows, columns };
}

export function normalizeRows(rows: RawRow[]): NormalizedRow[] {
  return rows.map((row) => {
    const normalized: NormalizedRow = { __raw: row };
    for (const [column, rawValue] of Object.entries(row)) {
      const key = detectCanonicalKey(column);
      if (!key) continue;
      switch (key) {
        case "year":
        case "faculty":
        case "study_program":
        case "degree":
        case "partners":
        case "evidence":
          normalized[key] = toString(rawValue);
          break;
        default:
          normalized[key] = toNumber(rawValue);
      }
    }
    return normalized;
  });
}

export function detectNumericColumns(rows: RawRow[], columns: string[]): string[] {
  return columns.filter((column) => {
    const sample = rows.slice(0, 50).map((row) => row[column]).filter((v) => v !== "" && v != null);
    if (!sample.length) return false;
    const numericCount = sample.filter((v) => toNumber(v) !== undefined).length;
    return numericCount / sample.length > 0.7;
  });
}

export function generateProfile(rows: RawRow[], columns: string[]): DataProfile {
  const numericColumns = detectNumericColumns(rows, columns);
  const categoricalColumns = columns.filter((column) => !numericColumns.includes(column));
  const missingByColumn = columns.map((column) => {
    const missing = rows.filter((row) => {
      const value = row[column];
      return value == null || String(value).trim() === "";
    }).length;
    return { column, missing, percentage: rows.length ? (missing / rows.length) * 100 : 0 };
  });

  const seen = new Set<string>();
  let duplicateRows = 0;
  for (const row of rows) {
    const signature = JSON.stringify(row);
    if (seen.has(signature)) duplicateRows += 1;
    seen.add(signature);
  }

  return {
    totalRows: rows.length,
    totalColumns: columns.length,
    numericColumns,
    categoricalColumns,
    missingByColumn,
    duplicateRows,
  };
}

export function filterRows(rows: NormalizedRow[], filters: DashboardFilters): NormalizedRow[] {
  return rows.filter((row) => {
    if (filters.year && row.year !== filters.year) return false;
    if (filters.faculty && row.faculty !== filters.faculty) return false;
    if (filters.degree && row.degree !== filters.degree) return false;
    if (filters.search) {
      const target = `${row.study_program ?? ""} ${row.faculty ?? ""}`.toLowerCase();
      if (!target.includes(filters.search.toLowerCase())) return false;
    }
    return true;
  });
}

export function calculateKpis(rows: NormalizedRow[]) {
  const sum = (values: number[]) => values.reduce((acc, val) => acc + val, 0);
  const uniqueCount = (values: Array<string | undefined>) => new Set(values.filter(Boolean)).size;
  const percentages = rows.map((r) => r.iku_percentage).filter((v): v is number => v !== undefined);

  return {
    totalStudyProgram: uniqueCount(rows.map((r) => r.study_program)),
    totalFaculty: uniqueCount(rows.map((r) => r.faculty)),
    totalLecturers: sum(rows.map((r) => r.total_lecturers ?? 0)),
    totalIkuQualified: sum(rows.map((r) => r.iku_total ?? 0)),
    avgIkuPercentage: percentages.length ? sum(percentages) / percentages.length : 0,
    totalPartners: uniqueCount(rows.map((r) => r.partners)),
  };
}

export function toProgramChart(rows: NormalizedRow[]) {
  return rows
    .filter((r) => r.study_program)
    .map((r) => ({
      study_program: r.study_program as string,
      iku_percentage: r.iku_percentage ?? 0,
      total_lecturers: r.total_lecturers ?? 0,
      iku_017: r.iku_017 ?? 0,
      iku_018: r.iku_018 ?? 0,
      coaching_achievement: r.coaching_achievement ?? 0,
      faculty: r.faculty ?? "Lainnya",
    }));
}

export function getRanking(rows: NormalizedRow[], direction: "asc" | "desc") {
  return [...rows]
    .filter((r) => r.study_program && r.iku_percentage !== undefined)
    .sort((a, b) => (direction === "desc" ? (b.iku_percentage ?? 0) - (a.iku_percentage ?? 0) : (a.iku_percentage ?? 0) - (b.iku_percentage ?? 0)))
    .slice(0, 10);
}

export function getInsights(rows: NormalizedRow[], threshold = 80) {
  const sorted = [...rows]
    .filter((r) => r.study_program && r.iku_percentage !== undefined)
    .sort((a, b) => (b.iku_percentage ?? 0) - (a.iku_percentage ?? 0));

  const facultyMap = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    if (!row.faculty || row.iku_percentage === undefined) continue;
    const prev = facultyMap.get(row.faculty) ?? { total: 0, count: 0 };
    facultyMap.set(row.faculty, { total: prev.total + row.iku_percentage, count: prev.count + 1 });
  }

  const topFaculty = [...facultyMap.entries()]
    .map(([faculty, v]) => ({ faculty, avg: v.total / v.count }))
    .sort((a, b) => b.avg - a.avg)[0];

  const avgAll = sorted.length
    ? sorted.reduce((acc, row) => acc + (row.iku_percentage ?? 0), 0) / sorted.length
    : 0;

  const belowThreshold = sorted.filter((r) => (r.iku_percentage ?? 0) < threshold).map((r) => r.study_program as string);

  return {
    topProgram: sorted[0],
    bottomProgram: sorted[sorted.length - 1],
    topFaculty,
    avgAll,
    belowThreshold,
    threshold,
  };
}

export function exportRowsToCsv(rows: RawRow[], filename = "export.csv") {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const escapeCell = (value: unknown) => {
    const text = String(value ?? "");
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };
  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escapeCell(row[column])).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function generateMockIku005Data(faculty: string, year: string): { rows: RawRow[]; columns: string[] } {
  const columns = [
    "Tahun",
    "Fakultas",
    "Program Studi",
    "Jenjang",
    "Total Kerjasama",
    "Jumlah Luaran Kerjasama",
    "Jumlah Paten/Lisensi",
    "Total Luaran Memenuhi IKU",
    "Persentase IKU 005",
    "Mitra Industri/Start-Up",
    "Evidence"
  ];

  let programs: { name: string; degree: string }[] = [];
  if (faculty === "Teknik") {
    programs = [
      { name: "S1 Teknik Informatika", degree: "S1" },
      { name: "S1 Teknik Elektro", degree: "S1" },
      { name: "S1 Teknik Mesin", degree: "S1" },
      { name: "S1 Teknik Sipil", degree: "S1" },
      { name: "S1 Teknik Kimia", degree: "S1" },
      { name: "S1 Teknik Industri", degree: "S1" }
    ];
  } else if (faculty === "MIPA") {
    programs = [
      { name: "S1 Matematika", degree: "S1" },
      { name: "S1 Fisika", degree: "S1" },
      { name: "S1 Kimia", degree: "S1" },
      { name: "S1 Biologi", degree: "S1" },
      { name: "S1 Statistika", degree: "S1" }
    ];
  } else if (faculty === "Ekonomi") {
    programs = [
      { name: "S1 Manajemen", degree: "S1" },
      { name: "S1 Akuntansi", degree: "S1" },
      { name: "S1 Ekonomi Pembangunan", degree: "S1" }
    ];
  } else {
    programs = [
      { name: "S1 Kedokteran", degree: "S1" },
      { name: "S1 Farmasi", degree: "S1" },
      { name: "S1 Psikologi", degree: "S1" }
    ];
  }

  const partnersList = [
    "PT GoTo Gojek Tokopedia, Tbk",
    "PT Telkom Indonesia, Tbk",
    "PT Astra International, Tbk",
    "PT Pertamina (Persero)",
    "Kementerian Komunikasi dan Informatika",
    "Google Developer Student Clubs"
  ];

  const rows: RawRow[] = programs.map((prog, idx) => {
    const seed = idx + faculty.length + Number(year);
    const totalKerjasama = 5 + (seed % 10);
    const luaran = Math.floor(totalKerjasama * (0.6 + ((seed * 3) % 5) * 0.08));
    const paten = Math.floor(luaran * (0.1 + ((seed * 2) % 4) * 0.05));
    const ikuTotal = Math.min(totalKerjasama, luaran + paten);
    const ikuPct = Math.round((ikuTotal / totalKerjasama) * 10000) / 100;

    return {
      "Tahun": year,
      "Fakultas": faculty,
      "Program Studi": prog.name,
      "Jenjang": prog.degree,
      "Total Kerjasama": totalKerjasama,
      "Jumlah Luaran Kerjasama": luaran,
      "Jumlah Paten/Lisensi": paten,
      "Total Luaran Memenuhi IKU": ikuTotal,
      "Persentase IKU 005": ikuPct,
      "Mitra Industri/Start-Up": partnersList[idx % partnersList.length],
      "Evidence": `PKS_Mitra_${faculty}_${prog.name.replace(/\s+/g, "_")}_${year}.pdf`
    };
  });

  return { rows, columns };
}
