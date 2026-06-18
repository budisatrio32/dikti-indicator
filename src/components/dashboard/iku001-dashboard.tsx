"use client";

import { useMemo, useState } from "react";
import {
  InlineNotification,
  Tile,
  Tag,
  Button,
  Loading,
  Dropdown,
  Search,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  SkeletonText,
  SkeletonPlaceholder
} from "@carbon/react";
import { Filter } from "@carbon/icons-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import type { RawRow } from "@/types/data";

type Props = {
  rows: RawRow[];
  parseStatus: "idle" | "loading" | "success" | "error";
  errorMessage: string | null;
};

type ParsedRow = {
  year: string;
  faculty: string;
  degree: string;
  studyProgram: string;
  studentsIn: number;
  graduatesOnTime: number;
};

const AEE_IDEAL_BY_DEGREE: Record<string, number> = {
  D3: 33,
  S1: 25,
  S2: 50,
  S3: 33
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#161616",
  border: "1px solid rgba(244, 244, 244, 0.32)",
  borderRadius: "4px",
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.35)",
  opacity: 1
};

function Iku001ChartTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: string | number; color?: string }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div style={CHART_TOOLTIP_STYLE}>
      {label !== undefined && (
        <div style={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>
          {String(label)}
        </div>
      )}
      {payload.map((entry, idx) => (
        <div key={`${entry.name || "item"}-${idx}`} style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#f4f4f4", fontSize: "0.75rem" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: entry.color || "#f4f4f4", flexShrink: 0 }} />
          <span>{entry.name || "Nilai"}:</span>
          <strong style={{ color: "#ffffff" }}>{String(entry.value ?? "-")}</strong>
        </div>
      ))}
    </div>
  );
}

const findColumn = (columns: string[], patterns: RegExp[], fallback = "") => {
  for (const pattern of patterns) {
    const found = columns.find((c) => pattern.test(c.toLowerCase()));
    if (found) return found;
  }
  return fallback;
};

const toNum = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ".").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const toStr = (v: unknown) => (v == null ? "" : String(v).trim());

export function Iku001Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <Tile style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Loading withOverlay={false} small description="Memuat data IKU 001..." />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <strong style={{ fontSize: "0.875rem", color: "var(--cds-text-primary)" }}>Memuat data IKU 001</strong>
          <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
            Sedang mengurai spreadsheet dan menyiapkan chart.
          </span>
        </div>
      </Tile>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <Tile key={idx}><SkeletonText heading width="70%" /><SkeletonText paragraph lineCount={2} width="90%" /></Tile>
        ))}
      </div>
      <Tile><SkeletonPlaceholder style={{ width: "100%", height: "280px" }} /></Tile>
      <Tile><SkeletonPlaceholder style={{ width: "100%", height: "280px" }} /></Tile>
    </div>
  );
}

export function Iku001Dashboard({ rows, parseStatus, errorMessage }: Props) {
  const parsed = useMemo(() => {
    if (!rows.length) return [] as ParsedRow[];

    const cols = Object.keys(rows[0]);
    const yearCol = findColumn(cols, [/^tahun$/, /year/]);
    const facCol = findColumn(cols, [/fakultas/, /faculty/]);
    const degreeCol = findColumn(cols, [/jenjang/, /degree/]);
    const prodiCol = findColumn(cols, [/program studi/, /prodi/, /study.*program/]);
    const inCol = findColumn(cols, [/mahasiswa.*masuk/, /total.*masuk/, /new.*student/]);
    const gradCol = findColumn(cols, [/lulus.*tepat.*waktu/, /on.?time.*graduate/, /graduat/]);

    if (!yearCol || !facCol || !degreeCol || !prodiCol || !inCol || !gradCol) return [];

    return rows.map((row) => ({
      year: toStr(row[yearCol]),
      faculty: toStr(row[facCol]),
      degree: toStr(row[degreeCol]),
      studyProgram: toStr(row[prodiCol]),
      studentsIn: toNum(row[inCol]),
      graduatesOnTime: toNum(row[gradCol])
    })).filter((r) => r.year && r.faculty && r.studyProgram);
  }, [rows]);

  const [year, setYear] = useState("");
  const [faculty, setFaculty] = useState("");
  const [degree, setDegree] = useState("");
  const [program, setProgram] = useState("");
  const [search, setSearch] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showInsightToast, setShowInsightToast] = useState(true);

  const years = useMemo(() => [...new Set(parsed.map((r) => r.year))].sort(), [parsed]);
  const faculties = useMemo(() => [...new Set(parsed.map((r) => r.faculty))].sort(), [parsed]);
  const degrees = useMemo(() => [...new Set(parsed.map((r) => r.degree))].sort(), [parsed]);
  const programs = useMemo(() => [...new Set(parsed.map((r) => r.studyProgram))].sort(), [parsed]);

  const filtered = useMemo(() => {
    return parsed.filter((r) => {
      if (year && r.year !== year) return false;
      if (faculty && r.faculty !== faculty) return false;
      if (degree && r.degree !== degree) return false;
      if (program && r.studyProgram !== program) return false;
      if (search && !r.studyProgram.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [parsed, year, faculty, degree, program, search]);

  const aggregateAee = (items: ParsedRow[]) => {
    const totalIn = items.reduce((a, b) => a + b.studentsIn, 0);
    const totalGrad = items.reduce((a, b) => a + b.graduatesOnTime, 0);
    const real = totalIn > 0 ? (totalGrad / totalIn) * 100 : 0;
    const weightedIdealNumerator = items.reduce(
      (acc, row) => acc + row.studentsIn * (AEE_IDEAL_BY_DEGREE[row.degree] ?? 0),
      0
    );
    const ideal = totalIn > 0 ? weightedIdealNumerator / totalIn : 0;
    const achievement = ideal > 0 ? (real / ideal) * 100 : 0;
    return { totalIn, totalGrad, real, ideal, achievement };
  };

  const summary = useMemo(() => {
    const aee = aggregateAee(filtered);
    return {
      totalIn: aee.totalIn,
      totalGrad: aee.totalGrad,
      totalFaculty: new Set(filtered.map((r) => r.faculty)).size,
      totalProgram: new Set(filtered.map((r) => r.studyProgram)).size,
      iku: aee.achievement
    };
  }, [filtered]);

  const trend = useMemo(() => {
    const map = new Map<string, { year: string; rows: ParsedRow[] }>();
    for (const row of filtered) {
      const cur = map.get(row.year) ?? { year: row.year, rows: [] };
      cur.rows.push(row);
      map.set(row.year, cur);
    }
    return [...map.values()]
      .sort((a, b) => a.year.localeCompare(b.year))
      .map((d) => {
        const aee = aggregateAee(d.rows);
        return {
          year: d.year,
          totalIn: aee.totalIn,
          totalGrad: aee.totalGrad,
          iku: aee.achievement
        };
      });
  }, [filtered]);

  const byDegree = useMemo(() => {
    const map = new Map<string, { degree: string; in: number; grad: number }>();
    for (const row of filtered) {
      const cur = map.get(row.degree) ?? { degree: row.degree, in: 0, grad: 0 };
      cur.in += row.studentsIn;
      cur.grad += row.graduatesOnTime;
      map.set(row.degree, cur);
    }
    return ["D3", "S1", "S2", "S3"].map((d) => {
      const cur = map.get(d) ?? { degree: d, in: 0, grad: 0 };
      const ideal = AEE_IDEAL_BY_DEGREE[d] ?? 0;
      const real = cur.in > 0 ? (cur.grad / cur.in) * 100 : 0;
      return { ...cur, real, target: ideal, achievement: ideal > 0 ? (real / ideal) * 100 : 0 };
    });
  }, [filtered]);

  const facultyPerf = useMemo(() => {
    const map = new Map<string, { faculty: string; rows: ParsedRow[] }>();
    for (const row of filtered) {
      const cur = map.get(row.faculty) ?? { faculty: row.faculty, rows: [] };
      cur.rows.push(row);
      map.set(row.faculty, cur);
    }
    return [...map.values()]
      .map((f) => {
        const aee = aggregateAee(f.rows);
        return { faculty: f.faculty, in: aee.totalIn, grad: aee.totalGrad, iku: aee.achievement };
      })
      .sort((a, b) => b.iku - a.iku);
  }, [filtered]);

  const prodiPerf = useMemo(() => {
    const map = new Map<string, { studyProgram: string; faculty: string; degree: string; in: number; grad: number; iku: number }>();
    for (const row of filtered) {
      const key = `${row.faculty}::${row.studyProgram}`;
      const cur = map.get(key) ?? { studyProgram: row.studyProgram, faculty: row.faculty, degree: row.degree, in: 0, grad: 0, iku: 0 };
      cur.in += row.studentsIn;
      cur.grad += row.graduatesOnTime;
      map.set(key, cur);
    }
    return [...map.values()]
      .map((p) => {
        const real = p.in > 0 ? (p.grad / p.in) * 100 : 0;
        const ideal = AEE_IDEAL_BY_DEGREE[p.degree] ?? 0;
        const achievement = ideal > 0 ? (real / ideal) * 100 : 0;
        return { ...p, iku: achievement };
      })
      .sort((a, b) => b.iku - a.iku);
  }, [filtered]);

  const top10 = useMemo(() => prodiPerf.slice(0, 10), [prodiPerf]);
  const bottom10 = useMemo(() => [...prodiPerf].slice(-10).reverse(), [prodiPerf]);

  const insight = useMemo(() => {
    const last = trend[trend.length - 1];
    const prev = trend.length > 1 ? trend[trend.length - 2] : null;
    const diff = prev ? last.iku - prev.iku : 0;
    const topFaculty = facultyPerf[0];
    const topProgram = top10[0];
    if (!last || !topFaculty || !topProgram) return "Belum ada cukup data untuk menyusun insight otomatis IKU 001.";
    return `Nilai IKU 001 tahun ${last.year} sebesar ${last.iku.toFixed(2)}%, ${diff >= 0 ? "meningkat" : "menurun"} ${Math.abs(diff).toFixed(2)}% dibanding tahun sebelumnya. Fakultas ${topFaculty.faculty} memberikan kontribusi terbesar, sedangkan capaian tertinggi berada pada Program Studi ${topProgram.studyProgram}.`;
  }, [trend, facultyPerf, top10]);

  const rowsTable = useMemo(() => prodiPerf.map((p, i) => ({ id: `prodi-${i}`, studyProgram: p.studyProgram, faculty: p.faculty, degree: p.degree, studentsIn: String(p.in), graduatesOnTime: String(p.grad), iku: `${p.iku.toFixed(2)}%` })), [prodiPerf]);

  if (parseStatus === "loading") return <Iku001Skeleton />;

  if (parseStatus === "error") {
    return (
      <InlineNotification
        kind="error"
        title="Gagal Mengakses Sheet"
        subtitle={errorMessage || "Sumber data tidak dapat diakses. Periksa koneksi Google Sheet yang aktif."}
        hideCloseButton
        lowContrast
      />
    );
  }

  if (!parsed.length) {
    return (
      <Tile style={{ padding: "1.25rem" }}>
        <InlineNotification
          kind="warning"
          title="Data IKU 001 Tidak Tersedia"
          subtitle="Dataset aktif belum memiliki kolom minimal: Tahun, Fakultas, Jenjang, Program Studi, Mahasiswa Masuk, dan Lulus Tepat Waktu."
          hideCloseButton
          lowContrast
        />
      </Tile>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      <Tile style={{ padding: "0.75rem", position: "sticky", top: "0.5rem", zIndex: 40 }}>
        <div
          style={{
            background: "var(--cds-layer-01)"
          }}
        >
          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: 600, color: "var(--cds-text-secondary)" }}>
            Filter & Pencarian IKU 001
          </h4>
          <div className="dashboard-toolbars" style={{ position: "relative" }}>
            <Search id="iku001-search" size="sm" labelText="Search Prodi" placeholder="Search Prodi" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
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
                  <Dropdown id="iku001-year" size="sm" titleText="Tahun" label="Pilih tahun" items={["Semua", ...years]} selectedItem={year || "Semua"} onChange={({ selectedItem }) => setYear(selectedItem === "Semua" ? "" : String(selectedItem || ""))} />
                </div>
                <div className="iku001-filter-card">
                  <Dropdown id="iku001-fac" size="sm" titleText="Fakultas" label="Pilih fakultas" items={["Semua", ...faculties]} selectedItem={faculty || "Semua"} onChange={({ selectedItem }) => setFaculty(selectedItem === "Semua" ? "" : String(selectedItem || ""))} />
                </div>
                <div className="iku001-filter-card">
                  <Dropdown id="iku001-degree" size="sm" titleText="Jenjang" label="Pilih jenjang" items={["Semua", ...degrees]} selectedItem={degree || "Semua"} onChange={({ selectedItem }) => setDegree(selectedItem === "Semua" ? "" : String(selectedItem || ""))} />
                </div>
                <div className="iku001-filter-card">
                  <Dropdown id="iku001-prodi" size="sm" titleText="Program Studi" label="Pilih program studi" items={["Semua", ...programs]} selectedItem={program || "Semua"} onChange={({ selectedItem }) => setProgram(selectedItem === "Semua" ? "" : String(selectedItem || ""))} />
                </div>
                <Button
                  size="sm"
                  kind="ghost"
                  onClick={() => {
                    setYear("");
                    setFaculty("");
                    setDegree("");
                    setProgram("");
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            )}
          </div>
        </div>
      </Tile>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <Tile><div className="iku-kpi-tile__label">Total Mahasiswa Masuk</div><div className="iku-kpi-tile__value">{summary.totalIn.toLocaleString("id-ID")}</div></Tile>
        <Tile><div className="iku-kpi-tile__label">Total Lulus Tepat Waktu</div><div className="iku-kpi-tile__value">{summary.totalGrad.toLocaleString("id-ID")}</div></Tile>
        <Tile><div className="iku-kpi-tile__label">Total Fakultas</div><div className="iku-kpi-tile__value">{summary.totalFaculty}</div></Tile>
        <Tile><div className="iku-kpi-tile__label">Total Program Studi</div><div className="iku-kpi-tile__value">{summary.totalProgram}</div></Tile>
        <Tile><div className="iku-kpi-tile__label">Nilai IKU 001 Saat Ini</div><div className="iku-kpi-tile__value" style={{ color: "#0f62fe" }}>{summary.iku.toFixed(2)}%</div></Tile>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1rem" }}>
        <Tile style={{ minHeight: "320px" }}>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Trend Analisis IKU 001</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis /><Tooltip content={<Iku001ChartTooltip />} /><Line type="monotone" dataKey="iku" stroke="#0f62fe" name="IKU (%)" /></LineChart>
          </ResponsiveContainer>
        </Tile>
        <Tile style={{ minHeight: "320px" }}>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Trend Mahasiswa Masuk & Lulus Tepat Waktu</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis /><Tooltip content={<Iku001ChartTooltip />} /><Line type="monotone" dataKey="totalIn" stroke="#198038" name="Mahasiswa Masuk" /><Line type="monotone" dataKey="totalGrad" stroke="#8a3ffc" name="Lulus Tepat Waktu" /></LineChart>
          </ResponsiveContainer>
        </Tile>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1rem" }}>
        <Tile>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Breakdown Jenjang</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", background: "#ffffff", border: "1px solid var(--cds-border-subtle-01)" }}>
            <thead>
              <tr style={{ background: "var(--cds-layer-02)", borderBottom: "1px solid var(--cds-border-subtle-01)" }}>
                <th style={{ textAlign: "left", padding: "0.5rem 0.625rem", fontWeight: 600 }}>Jenjang</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.625rem", fontWeight: 600 }}>Masuk</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.625rem", fontWeight: 600 }}>Lulus Tepat Waktu</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.625rem", fontWeight: 600 }}>AEE Realisasi</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.625rem", fontWeight: 600 }}>Target Ideal</th>
                <th style={{ textAlign: "right", padding: "0.5rem 0.625rem", fontWeight: 600 }}>Tingkat Pencapaian</th>
              </tr>
            </thead>
            <tbody>
              {byDegree.map((d, idx) => (
                <tr key={d.degree} style={{ borderBottom: "1px solid var(--cds-border-subtle-00)", background: idx % 2 === 0 ? "#ffffff" : "var(--cds-layer-01)" }}>
                  <td style={{ padding: "0.5rem 0.625rem", fontWeight: 600 }}>{d.degree}</td>
                  <td style={{ padding: "0.5rem 0.625rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.in.toLocaleString("id-ID")}</td>
                  <td style={{ padding: "0.5rem 0.625rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.grad.toLocaleString("id-ID")}</td>
                  <td style={{ padding: "0.5rem 0.625rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.real.toFixed(2)}%</td>
                  <td style={{ padding: "0.5rem 0.625rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.target.toFixed(2)}%</td>
                  <td style={{ padding: "0.5rem 0.625rem", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{d.achievement.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tile>
        <Tile>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Analisis Fakultas</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={facultyPerf}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="faculty" /><YAxis /><Tooltip content={<Iku001ChartTooltip />} /><Bar dataKey="iku" fill="#0f62fe" name="IKU (%)" /></BarChart>
          </ResponsiveContainer>
          {facultyPerf[0] && facultyPerf[facultyPerf.length - 1] && (
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <Tag type="green">Tertinggi: {facultyPerf[0].faculty} ({facultyPerf[0].iku.toFixed(2)}%)</Tag>
              <Tag type="red">Terendah: {facultyPerf[facultyPerf.length - 1].faculty} ({facultyPerf[facultyPerf.length - 1].iku.toFixed(2)}%)</Tag>
            </div>
          )}
        </Tile>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem" }}>
        <Tile>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Ranking Top 10 Prodi</h4>
          {top10.map((r, i) => <div key={`${r.studyProgram}-${i}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", padding: "0.25rem 0" }}><span>{r.studyProgram}</span><strong>{r.iku.toFixed(2)}%</strong></div>)}
        </Tile>
        <Tile>
          <h4 style={{ margin: "0 0 0.75rem 0" }}>Ranking Bottom 10 Prodi</h4>
          {bottom10.map((r, i) => <div key={`${r.studyProgram}-${i}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", padding: "0.25rem 0" }}><span>{r.studyProgram}</span><strong>{r.iku.toFixed(2)}%</strong></div>)}
        </Tile>
      </section>

      <Tile>
        <h4 style={{ margin: "0 0 0.75rem 0" }}>Data Table Program Studi</h4>
        <DataTable
          rows={rowsTable}
          headers={[
            { key: "studyProgram", header: "Program Studi" },
            { key: "faculty", header: "Fakultas" },
            { key: "degree", header: "Jenjang" },
            { key: "studentsIn", header: "Mahasiswa Masuk" },
            { key: "graduatesOnTime", header: "Lulus Tepat Waktu" },
            { key: "iku", header: "IKU 001" }
          ]}
          isSortable
          size="sm"
        >
          {({ rows, headers, getTableProps, getTableContainerProps, getToolbarProps, getHeaderProps, getRowProps }) => (
            <TableContainer {...getTableContainerProps()}>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch persistent placeholder="Search Prodi" onChange={(e: any) => setSearch(e.target.value)} value={search} />
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => {
                      const { key, ...rest } = getHeaderProps({ header });
                      return <TableHeader key={String(key ?? header.key)} {...rest}>{header.header}</TableHeader>;
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const { key, ...rest } = getRowProps({ row });
                    return <TableRow key={String(key ?? row.id)} {...rest}>{row.cells.map((cell) => <TableCell key={cell.id}>{cell.value}</TableCell>)}</TableRow>;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </Tile>

      {showInsightToast && (
        <div
          style={{
            position: "fixed",
            right: "1rem",
            bottom: "1rem",
            zIndex: 1200,
            width: "min(420px, calc(100vw - 2rem))"
          }}
        >
          <InlineNotification
            kind="info"
            title="Insight Otomatis"
            subtitle={insight}
            lowContrast
            onCloseButtonClick={() => setShowInsightToast(false)}
          />
        </div>
      )}
    </div>
  );
}
