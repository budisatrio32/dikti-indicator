"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  InlineNotification,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  Search,
  Tag,
  Tile,
  Loading,
  SkeletonPlaceholder,
  SkeletonText,
  DataTable,
} from "@carbon/react";
import { Download, Filter } from "@carbon/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RawRow } from "@/types/data";

const CDS_COLORS = ["#ee538b", "#0f62fe", "#198038", "#8a3ffc", "#009d9a", "#6f6f6f"];
const CHART_LEGEND_STYLE = { color: "#161616", fontWeight: 600 };

type Props = {
  rows: RawRow[];
  parseStatus: "idle" | "loading" | "success" | "error";
  errorMessage: string | null;
};

type Iku007Row = {
  year: string;
  faculty: string;
  prodi: string;
  degree: string;
  totalActivities: number;
  wajib: number;
  unggulan: number;
  totalSuccess: number;
  ikuPercentage: number;
  partners: string;
  evidence: string;
  __raw: RawRow;
};

type SortKey = "year" | "faculty" | "prodi" | "totalActivities" | "wajib" | "unggulan" | "totalSuccess" | "ikuPercentage";

type ScopeCardProps = {
  label: string;
  value: string;
  tone?: "brand" | "success" | "secondary";
};

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumn(columns: string[], patterns: RegExp[], fallback = "") {
  for (const pattern of patterns) {
    const found = columns.find((column) => pattern.test(normalizeText(column)));
    if (found) return found;
  }
  return fallback;
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ".").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toStringValue(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function uniqueSorted(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "id"));
}

function safePercent(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function formatNumber(value: number) {
  return value.toLocaleString("id-ID");
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: string | number; color?: string }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "#161616",
        border: "1px solid rgba(244, 244, 244, 0.32)",
        borderRadius: "4px",
        padding: "0.5rem 0.625rem",
        boxShadow: "0 8px 20px rgba(0, 0, 0, 0.35)",
        opacity: 1,
      }}
    >
      {label !== undefined && (
        <div style={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
          {String(label)}
        </div>
      )}
      {payload.map((entry, idx) => (
        <div
          key={`${entry.name || "item"}-${idx}`}
          style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#f4f4f4", fontSize: "0.75rem" }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: entry.color || "#f4f4f4",
              flexShrink: 0,
            }}
          />
          <span>{entry.name || "Nilai"}:</span>
          <strong style={{ color: "#ffffff" }}>{String(entry.value ?? "-")}</strong>
        </div>
      ))}
    </div>
  );
}

function ScopeCard({ label, value, tone = "secondary" }: ScopeCardProps) {
  const tagType = tone === "brand" ? "blue" : tone === "success" ? "green" : "cool-gray";
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", color: "var(--cds-text-secondary)", letterSpacing: "0.04em" }}>
        {label}
      </p>
      <Tag type={tagType} size="sm" style={{ margin: 0, maxWidth: "100%" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
      </Tag>
    </div>
  );
}

export function Iku007Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Tile style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <Loading withOverlay={false} small description="Memuat data IKU 007..." />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <strong style={{ fontSize: "0.875rem", color: "var(--cds-text-primary)" }}>Memuat dashboard IKU 007</strong>
          <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
            Menyiapkan agregasi keterlibatan program SDGs (SDG 1, 4, 17, dan program unggulan lainnya).
          </span>
        </div>
      </Tile>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Tile key={index} style={{ padding: "1rem" }}>
            <SkeletonText heading width="60%" />
            <SkeletonText paragraph lineCount={2} width="90%" />
          </Tile>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1rem" }}>
        <Tile style={{ minHeight: "320px" }}><SkeletonPlaceholder style={{ width: "100%", height: "280px" }} /></Tile>
        <Tile style={{ minHeight: "320px" }}><SkeletonPlaceholder style={{ width: "100%", height: "280px" }} /></Tile>
      </div>
    </div>
  );
}

export function Iku007DashboardView({ rows, parseStatus, errorMessage }: Props) {
  const parsedRows = useMemo<Iku007Row[]>(() => {
    if (!rows.length) return [];

    const columns = Object.keys(rows[0]);
    const yearCol = findColumn(columns, [/^tahun$/, /year/], "Tahun");
    const facultyCol = findColumn(columns, [/^fakultas$/, /faculty/], "Fakultas");
    const prodiCol = findColumn(columns, [/^program.*studi$/, /^prodi$/, /study.*program/, /prodi/], "Program Studi");
    const degreeCol = findColumn(columns, [/^jenjang$/, /degree/], "Jenjang");
    const totalActivitiesCol = findColumn(columns, [/total.*kegiatan.*sdg/, /jumlah.*kegiatan.*sdg/, /total.*program.*sdg/, /total_lecturers/, /total.*kegiatan/], "Total Kegiatan SDG");
    const wajibCol = findColumn(columns, [/kegiatan.*sdg.*wajib/, /sdg.*wajib/, /jumlah.*kegiatan.*sdg.*wajib/, /iku.*017/], "Kegiatan SDG Wajib");
    const unggulanCol = findColumn(columns, [/kegiatan.*sdg.*unggulan/, /sdg.*unggulan/, /kegiatan.*sdg.*pilihan/, /sdg.*pilihan/, /iku.*018/], "Kegiatan SDG Unggulan");
    const totalSuccessCol = findColumn(columns, [/total.*kegiatan.*memenuhi.*iku/, /total.*memenuhi.*iku/, /iku_total/], "Total Kegiatan Memenuhi IKU");
    const ikuPercentageCol = findColumn(columns, [/persentase.*iku.*007/, /persentase.*iku/, /iku.*percentage/, /iku007/, /keterlibatan.*sdg/], "Persentase IKU 007");
    const partnersCol = findColumn(columns, [/nama.*kegiatan/, /mitra/, /partners/], "Nama Kegiatan/Mitra");
    const evidenceCol = findColumn(columns, [/evidence/, /bukti/], "Evidence");

    return rows
      .map((row) => {
        const year = toStringValue(row[yearCol]);
        const faculty = toStringValue(row[facultyCol]);
        const prodi = toStringValue(row[prodiCol]);
        const degree = toStringValue(row[degreeCol]);
        const totalActivities = Math.max(0, toNumber(row[totalActivitiesCol]));
        const wajib = Math.max(0, toNumber(row[wajibCol]));
        const unggulan = Math.max(0, toNumber(row[unggulanCol]));
        const partners = toStringValue(row[partnersCol]);
        const evidence = toStringValue(row[evidenceCol]);
        
        let totalSuccess = toNumber(row[totalSuccessCol]);
        if (!totalSuccess && (wajib || unggulan)) {
          totalSuccess = wajib + unggulan;
        }
        totalSuccess = Math.min(totalActivities, Math.max(0, totalSuccess));

        let ikuPercentage = toNumber(row[ikuPercentageCol]);
        if (!ikuPercentage) {
          ikuPercentage = safePercent(totalSuccess, totalActivities);
        }

        return {
          year,
          faculty,
          prodi,
          degree,
          totalActivities,
          wajib,
          unggulan,
          totalSuccess,
          ikuPercentage,
          partners,
          evidence,
          __raw: row,
        };
      })
      .filter((row) => row.year && row.faculty && row.prodi);
  }, [rows]);

  const [year, setYear] = useState("");
  const [faculty, setFaculty] = useState("");
  const [degree, setDegree] = useState("");
  const [prodi, setProdi] = useState("");
  const [search, setSearch] = useState("");
  const [tableSortKey, setTableSortKey] = useState<SortKey>("ikuPercentage");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("desc");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showInsightToast, setShowInsightToast] = useState(true);

  const yearOptions = useMemo(() => uniqueSorted(parsedRows.map((row) => row.year)), [parsedRows]);
  const facultyOptions = useMemo(
    () => uniqueSorted(parsedRows.filter((row) => !year || row.year === year).map((row) => row.faculty)),
    [parsedRows, year]
  );
  const degreeOptions = useMemo(
    () =>
      uniqueSorted(
        parsedRows
          .filter((row) => (!year || row.year === year) && (!faculty || row.faculty === faculty))
          .map((row) => row.degree)
      ),
    [parsedRows, year, faculty]
  );
  const prodiOptions = useMemo(
    () =>
      uniqueSorted(
        parsedRows
          .filter((row) => (!year || row.year === year) && (!faculty || row.faculty === faculty) && (!degree || row.degree === degree))
          .map((row) => row.prodi)
      ),
    [parsedRows, year, faculty, degree]
  );

  const filteredRows = useMemo(() => {
    return parsedRows.filter((row) => {
      if (year && row.year !== year) return false;
      if (faculty && row.faculty !== faculty) return false;
      if (degree && row.degree !== degree) return false;
      if (prodi && row.prodi !== prodi) return false;
      if (
        search &&
        ![
          row.year,
          row.faculty,
          row.prodi,
          row.degree,
          row.totalActivities,
          row.wajib,
          row.unggulan,
          row.totalSuccess,
          row.ikuPercentage,
          row.partners,
        ].some((value) => String(value ?? "").toLowerCase().includes(search.toLowerCase()))
      ) {
        return false;
      }
      return true;
    });
  }, [parsedRows, year, faculty, degree, prodi, search]);

  const sortedTableRows = useMemo(() => {
    const next = [...filteredRows];
    next.sort((left, right) => {
      const compareString = (a: string, b: string) => a.localeCompare(b, "id", { numeric: true, sensitivity: "base" });
      const compareNumber = (a: number, b: number) => a - b;

      let diff = 0;
      switch (tableSortKey) {
        case "year":
          diff = compareString(left.year, right.year);
          break;
        case "faculty":
          diff = compareString(left.faculty, right.faculty);
          break;
        case "prodi":
          diff = compareString(left.prodi, right.prodi);
          break;
        case "totalActivities":
          diff = compareNumber(left.totalActivities, right.totalActivities);
          break;
        case "wajib":
          diff = compareNumber(left.wajib, right.wajib);
          break;
        case "unggulan":
          diff = compareNumber(left.unggulan, right.unggulan);
          break;
        case "totalSuccess":
          diff = compareNumber(left.totalSuccess, right.totalSuccess);
          break;
        case "ikuPercentage":
          diff = compareNumber(left.ikuPercentage, right.ikuPercentage);
          break;
      }

      return tableSortDirection === "asc" ? diff : -diff;
    });
    return next;
  }, [filteredRows, tableSortDirection, tableSortKey]);

  const kpis = useMemo(() => {
    const totalStudyProgram = new Set(filteredRows.map((row) => row.prodi)).size;
    const totalFaculty = new Set(filteredRows.map((row) => row.faculty)).size;
    const totalActivities = filteredRows.reduce((acc, row) => acc + row.totalActivities, 0);
    const totalSuccess = filteredRows.reduce((acc, row) => acc + row.totalSuccess, 0);
    const avgIkuPercentage = filteredRows.length
      ? filteredRows.reduce((acc, row) => acc + row.ikuPercentage, 0) / filteredRows.length
      : 0;

    return {
      totalStudyProgram,
      totalFaculty,
      totalActivities,
      avgIkuPercentage,
    };
  }, [filteredRows]);

  const chartData = useMemo(() => {
    return filteredRows.map((row) => ({
      study_program: row.prodi,
      iku_percentage: row.ikuPercentage,
      total_lecturers: row.totalActivities,
      iku_017: row.wajib,
      iku_018: row.unggulan,
      faculty: row.faculty,
    }));
  }, [filteredRows]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach((row) => {
      map.set(row.faculty, (map.get(row.faculty) ?? 0) + 1);
    });
    return [...map.entries()].map(([faculty, total]) => ({ faculty, total }));
  }, [filteredRows]);

  const rankingTopRows = useMemo(() => {
    return [...filteredRows]
      .sort((a, b) => b.ikuPercentage - a.ikuPercentage)
      .slice(0, 10)
      .map((row, idx) => ({
        id: `top-${idx}`,
        study_program: row.prodi,
        faculty: row.faculty,
        iku_percentage: row.ikuPercentage.toFixed(2) + "%",
      }));
  }, [filteredRows]);

  const rankingBottomRows = useMemo(() => {
    return [...filteredRows]
      .sort((a, b) => a.ikuPercentage - b.ikuPercentage)
      .slice(0, 10)
      .map((row, idx) => ({
        id: `bot-${idx}`,
        study_program: row.prodi,
        faculty: row.faculty,
        iku_percentage: row.ikuPercentage.toFixed(2) + "%",
      }));
  }, [filteredRows]);

  const insights = useMemo(() => {
    if (!filteredRows.length) return null;

    const sorted = [...filteredRows].sort((a, b) => b.ikuPercentage - a.ikuPercentage);

    const facultyMap = new Map<string, { totalPct: number; count: number }>();
    filteredRows.forEach((row) => {
      const prev = facultyMap.get(row.faculty) ?? { totalPct: 0, count: 0 };
      facultyMap.set(row.faculty, {
        totalPct: prev.totalPct + row.ikuPercentage,
        count: prev.count + 1,
      });
    });

    const facultyAverages = [...facultyMap.entries()].map(([faculty, data]) => ({
      faculty,
      avg: data.totalPct / data.count,
    }));
    const topFaculty = facultyAverages.sort((a, b) => b.avg - a.avg)[0];

    const threshold = 80;
    const belowThreshold = filteredRows.filter((row) => row.ikuPercentage < threshold);

    return {
      topProgram: sorted[0],
      bottomProgram: sorted[sorted.length - 1],
      topFaculty,
      belowThreshold,
      threshold,
    };
  }, [filteredRows]);

  const totalActivities = useMemo(() => filteredRows.reduce((acc, r) => acc + r.totalActivities, 0), [filteredRows]);
  const totalWajib = useMemo(() => filteredRows.reduce((acc, r) => acc + r.wajib, 0), [filteredRows]);
  const totalUnggulan = useMemo(() => filteredRows.reduce((acc, r) => acc + r.unggulan, 0), [filteredRows]);
  const dominantActivity = useMemo(() => (totalWajib >= totalUnggulan ? "Program SDG Wajib (SDG 1, 4, 17)" : "Program SDG Unggulan (Pilihan)"), [totalWajib, totalUnggulan]);

  const autoInsightText = useMemo(() => {
    if (!filteredRows.length) return "Belum ada data yang cocok dengan filter aktif.";
    if (!insights) return "";

    return `Tingkat Keterlibatan SDG (IKU 007) mencapai rata-rata ${formatPercent(kpis.avgIkuPercentage)}. Fakultas kontributor SDGs terbaik adalah ${insights.topFaculty?.faculty || "-"} (${formatPercent(insights.topFaculty?.avg || 0)}), dan program studi terbaik adalah ${insights.topProgram?.prodi || "-"} (${formatPercent(insights.topProgram?.ikuPercentage || 0)}). Program didominasi oleh ${dominantActivity} dengan total ${formatNumber(totalWajib)} kegiatan wajib dan ${formatNumber(totalUnggulan)} kegiatan unggulan.`;
  }, [filteredRows, insights, kpis.avgIkuPercentage, dominantActivity, totalWajib, totalUnggulan]);

  useEffect(() => {
    setShowInsightToast(true);
  }, [year, faculty, degree, prodi]);

  const resetAllFilters = () => {
    setYear("");
    setFaculty("");
    setDegree("");
    setProdi("");
    setSearch("");
    setTableSortKey("ikuPercentage");
    setTableSortDirection("desc");
    setShowFilterDropdown(false);
  };

  const setSort = (key: SortKey) => {
    if (tableSortKey === key) {
      setTableSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setTableSortKey(key);
    setTableSortDirection(key === "ikuPercentage" ? "desc" : "asc");
  };

  const downloadCsv = () => {
    if (!filteredRows.length) return;

    const csvColumns = [
      "Tahun",
      "Fakultas",
      "Program Studi",
      "Jenjang",
      "Total Kegiatan SDG",
      "Kegiatan SDG Wajib (SDG 1, 4, 17)",
      "Kegiatan SDG Unggulan",
      "Total Kegiatan Memenuhi IKU",
      "Persentase IKU 007",
      "Nama Kegiatan/Mitra",
      "Evidence",
    ];

    const escapeCell = (value: unknown) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    };

    const rowsCsv = filteredRows.map((row) =>
      [
        row.year,
        row.faculty,
        row.prodi,
        row.degree,
        row.totalActivities,
        row.wajib,
        row.unggulan,
        row.totalSuccess,
        row.ikuPercentage.toFixed(2),
        row.partners,
        row.evidence,
      ]
        .map(escapeCell)
        .join(",")
    );

    const blob = new Blob([[csvColumns.join(","), ...rowsCsv].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `IKU007_Detail_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    if (!filteredRows.length) return;
    try {
      const XLSX = await import("xlsx");
      const exportRows = filteredRows.map((row) => ({
        "Tahun": row.year,
        "Fakultas": row.faculty,
        "Program Studi": row.prodi,
        "Jenjang": row.degree,
        "Total Kegiatan SDG": row.totalActivities,
        "Kegiatan SDG Wajib (SDG 1, 4, 17)": row.wajib,
        "Kegiatan SDG Unggulan": row.unggulan,
        "Total Kegiatan Memenuhi IKU": row.totalSuccess,
        "Persentase IKU 007": Number(row.ikuPercentage.toFixed(2)),
        "Nama Kegiatan/Mitra": row.partners,
        "Evidence": row.evidence,
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "IKU 007 Detail");
      XLSX.writeFile(workbook, `IKU007_Detail_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (error) {
      console.error("Gagal mengekspor Excel:", error);
    }
  };

  const buildTableRowKey = (row: Iku007Row, index: number) =>
    `${row.year}-${row.faculty}-${row.prodi}-${index}`;

  if (parseStatus === "loading") return <Iku007Skeleton />;

  if (parseStatus === "error") {
    return (
      <InlineNotification
        kind="error"
        title="Gagal Memuat Data"
        subtitle={errorMessage || "Sumber data tidak dapat diakses. Periksa koneksi Google Sheet yang aktif."}
        hideCloseButton
        lowContrast
      />
    );
  }

  if (!parsedRows.length) {
    return (
      <Tile style={{ padding: "1.25rem" }}>
        <InlineNotification
          kind="warning"
          title="Data IKU 007 Tidak Tersedia"
          subtitle="Dataset aktif belum memiliki kolom minimal: Tahun, Fakultas, Program Studi, Jenjang, Total Kegiatan SDG, Kegiatan SDG Wajib (SDG 1, 4, 17), Kegiatan SDG Unggulan."
          hideCloseButton
          lowContrast
        />
      </Tile>
    );
  }

  const tableHeaders = [
    { key: "study_program", header: "Program Studi" },
    { key: "faculty", header: "Fakultas" },
    { key: "iku_percentage", header: "IKU 007 (%)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      {/* Search and Filter Panel */}
      <Tile style={{ padding: "1rem", position: "sticky", top: "0.5rem", zIndex: 20 }}>
        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 600, color: "var(--cds-text-secondary)" }}>
          Filter & Pencarian IKU 007
        </h4>
        <div className="dashboard-toolbars" style={{ position: "relative" }}>
          <Search
            id="iku007-search"
            size="sm"
            labelText="Search Kegiatan"
            placeholder="Search Kegiatan, Prodi, Fakultas, atau Tahun"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
          />
          <div className="iku001-filter-dropdown" style={{ position: "relative" }}>
            <Button
              size="sm"
              kind="tertiary"
              renderIcon={Filter}
              onClick={() => setShowFilterDropdown((prev) => !prev)}
            >
              Filter
            </Button>
          </div>
          {showFilterDropdown && (
            <div className="iku001-filter-panel iku001-filter-panel--overlay">
              <div className="iku001-filter-card">
                <Dropdown
                  id="iku007-year-filter"
                  size="sm"
                  titleText="Tahun"
                  label="Pilih tahun"
                  items={["Semua", ...yearOptions]}
                  selectedItem={year || "Semua"}
                  onChange={({ selectedItem }) => setYear(selectedItem === "Semua" ? "" : String(selectedItem || ""))}
                />
              </div>
              <div className="iku001-filter-card">
                <Dropdown
                  id="iku007-faculty-filter"
                  size="sm"
                  titleText="Fakultas"
                  label="Pilih fakultas"
                  items={["Semua", ...facultyOptions]}
                  selectedItem={faculty || "Semua"}
                  onChange={({ selectedItem }) => {
                    const nextFaculty = selectedItem === "Semua" ? "" : String(selectedItem || "");
                    setFaculty(nextFaculty);
                    setProdi("");
                  }}
                />
              </div>
              <div className="iku001-filter-card">
                <Dropdown
                  id="iku007-degree-filter"
                  size="sm"
                  titleText="Jenjang"
                  label="Pilih jenjang"
                  items={["Semua", ...degreeOptions]}
                  selectedItem={degree || "Semua"}
                  onChange={({ selectedItem }) => {
                    const nextDegree = selectedItem === "Semua" ? "" : String(selectedItem || "");
                    setDegree(nextDegree);
                    setProdi("");
                  }}
                />
              </div>
              <div className="iku001-filter-card">
                <Dropdown
                  id="iku007-prodi-filter"
                  size="sm"
                  titleText="Program Studi"
                  label="Pilih program studi"
                  items={["Semua", ...prodiOptions]}
                  selectedItem={prodi || "Semua"}
                  onChange={({ selectedItem }) => setProdi(selectedItem === "Semua" ? "" : String(selectedItem || ""))}
                />
              </div>
              <Button size="sm" kind="ghost" onClick={resetAllFilters}>
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </Tile>

      {/* KPI Summary Tiles */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <Tile style={{ padding: "1rem" }}>
          <ScopeCard label="Keterlibatan IKU 007" value={formatPercent(kpis.avgIkuPercentage)} tone="brand" />
        </Tile>
        <Tile style={{ padding: "1rem" }}>
          <ScopeCard label="Total Kegiatan SDG" value={formatNumber(kpis.totalActivities)} />
        </Tile>
        <Tile style={{ padding: "1rem" }}>
          <ScopeCard label="Total Fakultas" value={formatNumber(kpis.totalFaculty)} />
        </Tile>
        <Tile style={{ padding: "1rem" }}>
          <ScopeCard label="Total Program Studi" value={formatNumber(kpis.totalStudyProgram)} tone="success" />
        </Tile>
      </section>

      {/* Main Charts */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1rem" }}>
        <Tile style={{ minHeight: "320px" }}>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Persentase Keterlibatan SDG per Program Studi</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="study_program" hide />
              <YAxis domain={[0, 100]} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="iku_percentage" fill={CDS_COLORS[0]} name="Capaian IKU (%)" />
            </BarChart>
          </ResponsiveContainer>
        </Tile>

        <Tile style={{ minHeight: "320px" }}>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Distribusi Kegiatan per Fakultas</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="total" nameKey="faculty" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CDS_COLORS[i % CDS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="bottom" wrapperStyle={CHART_LEGEND_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </Tile>
      </section>

      {/* Stacked Component Charts & Total Activities */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1rem" }}>
        <Tile style={{ minHeight: "320px" }}>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Komponen Keterlibatan SDG Penunjang IKU 007</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="study_program" hide />
              <YAxis />
              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="top" wrapperStyle={CHART_LEGEND_STYLE} />
              <Bar dataKey="iku_017" stackId="stack" fill={CDS_COLORS[0]} name="Kegiatan SDG Wajib (SDG 1, 4, 17)" />
              <Bar dataKey="iku_018" stackId="stack" fill={CDS_COLORS[1]} name="Kegiatan SDG Unggulan (Pilihan)" />
            </BarChart>
          </ResponsiveContainer>
        </Tile>

        <Tile style={{ minHeight: "320px" }}>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Total Kegiatan SDG per Program Studi</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="study_program" hide />
              <YAxis />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="total_lecturers" fill={CDS_COLORS[3]} name="Jumlah Kegiatan" />
            </BarChart>
          </ResponsiveContainer>
        </Tile>
      </section>

      {/* Top 10 and Bottom 10 Program Study Tables */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1rem" }}>
        <Tile>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Top 10 Program Studi Terbaik</h4>
          <DataTable rows={rankingTopRows} headers={tableHeaders}>
            {({ rows: tableRows, headers, getHeaderProps, getRowProps, getTableContainerProps, getTableProps }) => (
              <TableContainer {...getTableContainerProps()}>
                <Table {...getTableProps()} size="sm">
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => {
                        const headerProps = getHeaderProps({ header });
                        const { key, ...rest } = headerProps;
                        return (
                          <TableHeader key={String(key ?? header.key)} {...rest}>
                            {header.header}
                          </TableHeader>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row) => {
                      const rowProps = getRowProps({ row });
                      const { key, ...rest } = rowProps;
                      return (
                        <TableRow key={String(key ?? row.id)} {...rest}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        </Tile>

        <Tile>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Bottom 10 Program Studi Terendah</h4>
          <DataTable rows={rankingBottomRows} headers={tableHeaders}>
            {({ rows: tableRows, headers, getHeaderProps, getRowProps, getTableContainerProps, getTableProps }) => (
              <TableContainer {...getTableContainerProps()}>
                <Table {...getTableProps()} size="sm">
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => {
                        const headerProps = getHeaderProps({ header });
                        const { key, ...rest } = headerProps;
                        return (
                          <TableHeader key={String(key ?? header.key)} {...rest}>
                            {header.header}
                          </TableHeader>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableRows.map((row) => {
                      const rowProps = getRowProps({ row });
                      const { key, ...rest } = rowProps;
                      return (
                        <TableRow key={String(key ?? row.id)} {...rest}>
                          {row.cells.map((cell) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
        </Tile>
      </section>

      {/* Automated Insight Analysis Section */}
      {insights && (
        <section style={{ width: "100%" }}>
          <Tile style={{ padding: "1.5rem", background: "var(--cds-layer-01)", border: "1px solid var(--cds-border-subtle-01)", borderRadius: "0" }}>
            <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--cds-text-primary)" }}>
              Analisis Insight Ringkas & Rekomendasi (IKU 007)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              <div>
                <h5 style={{ fontWeight: 600, color: "#0f62fe", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Sorotan Kinerja Utama</h5>
                <ul style={{ listStyleType: "disc", paddingLeft: "1.25rem", fontSize: "0.8125rem", lineHeight: "1.6", color: "var(--cds-text-secondary)" }}>
                  <li>
                    Fakultas dengan partisipasi SDG terbaik diraih oleh <strong>{insights.topFaculty?.faculty ?? "-"}</strong> dengan rata-rata capaian <strong>{insights.topFaculty?.avg.toFixed(2)}%</strong>.
                  </li>
                  <li>
                    Capaian tertinggi diraih oleh Program Studi <strong>{insights.topProgram?.prodi ?? "-"}</strong> (<strong>{insights.topProgram?.ikuPercentage.toFixed(2) ?? 0}%</strong>).
                  </li>
                  <li>
                    Capaian terendah berada pada Program Studi <strong>{insights.bottomProgram?.prodi ?? "-"}</strong> (<strong>{insights.bottomProgram?.ikuPercentage.toFixed(2) ?? 0}%</strong>).
                  </li>
                </ul>
              </div>
              <div>
                <h5 style={{ fontWeight: 600, color: "#198038", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Komposisi Kegiatan</h5>
                <ul style={{ listStyleType: "disc", paddingLeft: "1.25rem", fontSize: "0.8125rem", lineHeight: "1.6", color: "var(--cds-text-secondary)" }}>
                  <li>
                    Jumlah total program/kegiatan terdata adalah <strong>{totalActivities.toLocaleString("id-ID")}</strong> kegiatan.
                  </li>
                  <li>
                    Aktivitas penunjang didominasi oleh program <strong>{dominantActivity}</strong> dengan rincian <strong>{totalWajib.toLocaleString("id-ID")}</strong> kegiatan wajib (SDG 1, 4, 17) dan <strong>{totalUnggulan.toLocaleString("id-ID")}</strong> kegiatan pilihan.
                  </li>
                </ul>
              </div>
              <div>
                <h5 style={{ fontWeight: 600, color: insights.belowThreshold.length > 0 ? "#da1e28" : "#198038", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Rekomendasi & Evaluasi</h5>
                <ul style={{ listStyleType: "disc", paddingLeft: "1.25rem", fontSize: "0.8125rem", lineHeight: "1.6", color: "var(--cds-text-secondary)" }}>
                  <li>
                    Rata-rata kinerja IKU 007 institusi saat ini berada pada angka <strong>{kpis.avgIkuPercentage.toFixed(2)}%</strong>.
                  </li>
                  {insights.belowThreshold.length > 0 ? (
                    <li>
                      Terdapat <strong>{insights.belowThreshold.length}</strong> program studi yang berada di bawah target ambang batas keberhasilan (<strong>{insights.threshold}%</strong>). Disarankan perluasan jangkauan pengabdian masyarakat bertema pengentasan kemiskinan dan kemitraan SDGs.
                    </li>
                  ) : (
                    <li>
                      Semua program studi telah melampaui target ambang batas keberhasilan (<strong>{insights.threshold}%</strong>). Pertahankan keterlibatan program SDG dan perluas dokumentasi bukti implementasi (evidence)!
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Tile>
        </section>
      )}

      {/* Drill-down Detail Table */}
      <Tile style={{ padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <div>
            <h4 style={{ margin: "0 0 0.25rem 0" }}>Tabel Detail</h4>
            <p style={{ margin: 0, color: "var(--cds-text-secondary)", fontSize: "0.75rem" }}>
              Drill-down detail row-level mengikuti filter aktif. Klik header untuk sort.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button size="sm" kind="tertiary" renderIcon={Download} onClick={downloadCsv}>
              Export CSV
            </Button>
            <Button size="sm" kind="primary" renderIcon={Download} onClick={downloadExcel}>
              Export Excel
            </Button>
          </div>
        </div>

        <TableContainer title="" description="">
          <TableToolbar>
            <TableToolbarContent>
            </TableToolbarContent>
          </TableToolbar>

          <Table>
            <TableHead>
              <TableRow>
                {[
                  { key: "year", header: "Tahun" },
                  { key: "faculty", header: "Fakultas" },
                  { key: "prodi", header: "Program Studi" },
                  { key: "degree", header: "Jenjang" },
                  { key: "totalActivities", header: "Total Kegiatan SDG" },
                  { key: "wajib", header: "SDG Wajib" },
                  { key: "unggulan", header: "SDG Unggulan" },
                  { key: "totalSuccess", header: "Memenuhi IKU" },
                  { key: "ikuPercentage", header: "Persentase IKU" },
                ].map((column) => {
                  const active = tableSortKey === (column.key as SortKey);
                  const direction = active ? tableSortDirection : "desc";
                  return (
                    <TableHeader
                      key={column.key}
                      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
                      onClick={() => setSort(column.key as SortKey)}
                      style={{ cursor: "pointer", userSelect: "none" }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        {column.header}
                        {active && <span aria-hidden="true">{direction === "asc" ? "▲" : "▼"}</span>}
                      </span>
                    </TableHeader>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTableRows.map((row, index) => (
                <TableRow key={buildTableRowKey(row, index)}>
                  <TableCell>{row.year}</TableCell>
                  <TableCell>{row.faculty}</TableCell>
                  <TableCell>{row.prodi}</TableCell>
                  <TableCell>{row.degree}</TableCell>
                  <TableCell>{formatNumber(row.totalActivities)}</TableCell>
                  <TableCell>{formatNumber(row.wajib)}</TableCell>
                  <TableCell>{formatNumber(row.unggulan)}</TableCell>
                  <TableCell>{formatNumber(row.totalSuccess)}</TableCell>
                  <TableCell>{formatPercent(row.ikuPercentage)}</TableCell>
                </TableRow>
              ))}
              {sortedTableRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} style={{ textAlign: "center", color: "var(--cds-text-secondary)", padding: "2rem" }}>
                    Tidak ada data yang cocok dengan filter atau pencarian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Tile>

      {/* Insight Toast Notification */}
      {showInsightToast && (
        <div
          style={{
            position: "fixed",
            right: "1rem",
            bottom: "1rem",
            zIndex: 1200,
            width: "min(440px, calc(100vw - 2rem))",
          }}
        >
          <InlineNotification
            kind="info"
            title="Analisis Insight Otomatis"
            subtitle={autoInsightText}
            lowContrast
            onCloseButtonClick={() => setShowInsightToast(false)}
          />
        </div>
      )}
    </div>
  );
}
