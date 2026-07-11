"use client";

import { useState } from "react";
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag, Tile, SkeletonText, SkeletonPlaceholder, Modal } from "@carbon/react";
import { overviewDashboardItems, type DashboardTabConnection } from "@/lib/dashboard-config";
import { detectCanonicalKey } from "@/lib/normalization";
import type { DataProfile } from "@/types/data";
import { Link, Unlink, Search } from "@carbon/icons-react";

type OverviewKpis = {
  totalStudyProgram: number;
  avgIkuPercentage: number;
};

type Props = {
  kpis: OverviewKpis;
  hasValidData: boolean;
  threshold: number;
  onOpenUpload: () => void;
  dashboardConnections: DashboardTabConnection[];
  isLoading?: boolean;
  ikuTargets?: Record<string, number>;
  profile?: DataProfile | null;
  columns?: string[];
  onDisconnect?: (tab: string) => void;
};

export function DashboardOverview({ kpis, hasValidData, threshold, onOpenUpload, dashboardConnections, isLoading = false, ikuTargets = {}, profile = null, columns = [], onDisconnect }: Props) {
  const ikuKeys = Object.keys(ikuTargets);
  const registeredCount = ikuKeys.length;
  const sumTargets = ikuKeys.reduce((sum, key) => sum + (ikuTargets[key] ?? 0), 0);
  const avgTarget = registeredCount > 0 ? sumTargets / registeredCount : threshold;

  const [isDetectModalOpen, setIsDetectModalOpen] = useState(false);
  const [activeDetectTab, setActiveDetectTab] = useState("");
  const [activeDetectTitle, setActiveDetectTitle] = useState("");
  const [activeDetectSource, setActiveDetectSource] = useState("");

  const handleDetectDataset = (tab: string, title: string, source: string) => {
    setActiveDetectTab(tab);
    setActiveDetectTitle(title);
    setActiveDetectSource(source);
    setIsDetectModalOpen(true);
  };

  const renderChannelAction = (tab: string, title: string, sourceLabel: string, isConnected: boolean) => {
    if (isConnected) {
      return (
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <Button
            kind="tertiary"
            size="sm"
            hasIconOnly
            renderIcon={Link}
            iconDescription="Kelola / Ubah Koneksi"
            tooltipPosition="top"
            onClick={onOpenUpload}
          />
          <Button
            kind="ghost"
            size="sm"
            hasIconOnly
            renderIcon={Search}
            iconDescription="Deteksi Dataset"
            tooltipPosition="top"
            onClick={() => handleDetectDataset(tab, title, sourceLabel)}
          />
          <Button
            kind="danger--ghost"
            size="sm"
            hasIconOnly
            renderIcon={Unlink}
            iconDescription="Cabut Koneksi Dataset"
            tooltipPosition="top"
            onClick={() => onDisconnect?.(tab)}
          />
        </div>
      );
    }

    return (
      <Button
        kind="ghost"
        size="sm"
        hasIconOnly
        renderIcon={Link}
        iconDescription="Hubungkan Dataset"
        tooltipPosition="top"
        onClick={onOpenUpload}
      />
    );
  };

  const connectionsByTab = new Map(dashboardConnections.map((connection) => [connection.dashboardTab, connection]));
  const overviewRows = overviewDashboardItems.map((item) => {
    const mappedConnection = connectionsByTab.get(item.tab);
    const isConnected = Boolean(mappedConnection);
    const sourceLabel = mappedConnection?.sourceLabel || "";
    const hasValue = item.tab === "IKU 003" && isConnected && hasValidData && typeof kpis?.avgIkuPercentage === "number" && kpis.avgIkuPercentage > 0;
    const metricValue = hasValue ? `${kpis.avgIkuPercentage.toFixed(2)}%` : "-";

    return {
      ...item,
      isConnected,
      sourceLabel,
      metricValue,
    };
  });
  const connectedCount = overviewRows.filter((item) => item.isConnected).length;

  if (isLoading) {
    return (
      <div className="dashboard-overview-skeleton-pulse" style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
        <section className="dashboard-grid dashboard-grid--kpi">
          <Tile className="iku-kpi-tile">
            <div className="iku-kpi-tile__label">Indikator Terintegrasi</div>
            <div style={{ height: "2.5rem", display: "flex", alignItems: "center", margin: "0.375rem 0" }}>
              <SkeletonText heading width="40%" />
            </div>
            <div className="iku-kpi-tile__subtext">
              <SkeletonText width="80%" />
            </div>
          </Tile>
          <Tile className="iku-kpi-tile">
            <div className="iku-kpi-tile__label">Total Program Studi</div>
            <div style={{ height: "2.5rem", display: "flex", alignItems: "center", margin: "0.375rem 0" }}>
              <SkeletonText heading width="30%" />
            </div>
            <div className="iku-kpi-tile__subtext">
              <SkeletonText width="60%" />
            </div>
          </Tile>
          <Tile className="iku-kpi-tile">
            <div className="iku-kpi-tile__label">Rata-rata Capaian Kinerja</div>
            <div style={{ height: "2.5rem", display: "flex", alignItems: "center", margin: "0.375rem 0" }}>
              <SkeletonText heading width="35%" />
            </div>
            <div className="iku-kpi-tile__subtext">
              <SkeletonText width="70%" />
            </div>
          </Tile>
          <Tile className="iku-kpi-tile">
            <div className="iku-kpi-tile__label">Status Integrasi</div>
            <div style={{ height: "2.5rem", display: "flex", alignItems: "center", margin: "0.375rem 0" }}>
              <SkeletonText heading width="50%" />
            </div>
            <div className="iku-kpi-tile__subtext">
              <SkeletonText width="75%" />
            </div>
          </Tile>
        </section>

        <Tile style={{ padding: "1.5rem", background: "var(--cds-layer-01)", border: "1px solid var(--cds-border-subtle-01)", borderRadius: "0" }}>
          <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--cds-text-primary)" }}>
            Daftar Pencapaian Indikator Kinerja Utama (IKU) Universitas
          </h4>
          <div style={{ overflowX: "auto" }}>
            <Table size="lg">
              <TableHead>
                <TableRow>
                  <TableHeader>Indikator</TableHeader>
                  <TableHeader>Deskripsi Kinerja Utama</TableHeader>
                  <TableHeader>Status Sumber</TableHeader>
                  <TableHeader>Capaian Rata-Rata</TableHeader>
                  <TableHeader>Aksi Saluran</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={`skeleton-row-${index}`}>
                    <TableCell><SkeletonText width="50px" /></TableCell>
                    <TableCell><SkeletonText width="90%" /></TableCell>
                    <TableCell>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                        <SkeletonPlaceholder style={{ width: "100px", height: "18px" }} />
                      </div>
                    </TableCell>
                    <TableCell><SkeletonText width="45px" /></TableCell>
                    <TableCell><SkeletonPlaceholder style={{ width: "95px", height: "24px" }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Tile>
      </div>
    );
  }

  return (
    <div className="dashboard-overview-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      <section className="dashboard-grid dashboard-grid--kpi">
        <Tile className="iku-kpi-tile">
          <div className="iku-kpi-tile__label">Indikator Terintegrasi</div>
          <div className="iku-kpi-tile__value" style={{ color: "#0f62fe" }}>
            {connectedCount} / {overviewRows.length}
          </div>
          <div className="iku-kpi-tile__subtext">Mengikuti pemetaan koneksi dashboard per indikator</div>
        </Tile>
        <Tile className="iku-kpi-tile">
          <div className="iku-kpi-tile__label">Total Program Studi</div>
          <div className="iku-kpi-tile__value">{hasValidData ? kpis.totalStudyProgram : 0}</div>
          <div className="iku-kpi-tile__subtext">Terpantau aktif dalam sistem</div>
        </Tile>
        <Tile className="iku-kpi-tile">
          <div className="iku-kpi-tile__label">Rata-rata Capaian Kinerja</div>
          <div className="iku-kpi-tile__value" style={{ color: hasValidData && kpis.avgIkuPercentage >= avgTarget ? "#198038" : "inherit" }}>
            {hasValidData ? `${kpis.avgIkuPercentage.toFixed(2)}%` : "0.00%"}
          </div>
          <div className="iku-kpi-tile__subtext">Target rata-rata {registeredCount} IKU terdaftar: {avgTarget.toFixed(1)}%</div>
        </Tile>
        <Tile className="iku-kpi-tile">
          <div className="iku-kpi-tile__label">Status Integrasi</div>
          <div className="iku-kpi-tile__value" style={{ fontSize: "1.25rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.375rem", minHeight: "auto", margin: "0.375rem 0" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: hasValidData ? "#198038" : "#da1e28", display: "inline-block" }} />
            {hasValidData ? "Sinkron Terjaga" : "Menunggu Data"}
          </div>
          <div className="iku-kpi-tile__subtext">{hasValidData ? "Pembaruan real-time terdeteksi" : "Hubungkan data di samping"}</div>
        </Tile>
      </section>

      <Tile style={{ padding: "1.5rem", background: "var(--cds-layer-01)", border: "1px solid var(--cds-border-subtle-01)", borderRadius: "0" }}>
        <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--cds-text-primary)" }}>
          Daftar Pencapaian Indikator Kinerja Utama (IKU) Universitas
        </h4>
        <div style={{ overflowX: "auto" }}>
          <Table size="lg">
            <TableHead>
              <TableRow>
                <TableHeader>Indikator</TableHeader>
                <TableHeader>Deskripsi Kinerja Utama</TableHeader>
                <TableHeader>Status Sumber</TableHeader>
                <TableHeader>Capaian Rata-Rata</TableHeader>
                <TableHeader>Aksi Saluran</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {overviewRows.map((item) => (
                <TableRow
                  key={item.tab}
                  style={item.tab === "IKU 003" ? { backgroundColor: "var(--cds-layer-hover-01)" } : undefined}
                >
                  <TableCell style={{ fontWeight: 600 }}>
                    {item.tab}
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                      <Tag type={item.isConnected ? "green" : "red"}>
                        {item.isConnected ? "Aktif & Terhubung" : "Belum Terhubung"}
                      </Tag>
                      {item.sourceLabel ? (
                        <span style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>{item.sourceLabel}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell style={{ fontWeight: item.metricValue !== "-" ? 600 : undefined, fontFamily: "monospace" }}>
                    {item.metricValue}
                  </TableCell>
                  <TableCell>{renderChannelAction(item.tab, item.title, item.sourceLabel, item.isConnected)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Tile>

      {/* ── Modal Box: Dataset detection modal ── */}
      <Modal
        open={isDetectModalOpen}
        modalHeading={`Deteksi Struktur Dataset - ${activeDetectTab}`}
        primaryButtonText="Tutup"
        onRequestClose={() => setIsDetectModalOpen(false)}
        onRequestSubmit={() => setIsDetectModalOpen(false)}
        size="md"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "0.25rem 0" }}>
          <div>
            <h5 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--cds-text-primary)", margin: "0 0 0.25rem 0" }}>
              {activeDetectTitle}
            </h5>
            <p style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)", margin: 0 }}>
              Sumber Terkoneksi: <span style={{ fontWeight: 600 }}>{activeDetectSource}</span>
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", margin: "0.5rem 0" }}>
            <Tile style={{ padding: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>Total Baris</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "0.25rem" }}>
                {profile?.totalRows ?? 0}
              </div>
            </Tile>
            <Tile style={{ padding: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>Total Kolom</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "0.25rem" }}>
                {profile?.totalColumns ?? 0}
              </div>
            </Tile>
            <Tile style={{ padding: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>Duplikasi Baris</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "0.25rem" }}>
                {profile?.duplicateRows ?? 0}
              </div>
            </Tile>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h5 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--cds-text-primary)", margin: 0 }}>
              Deteksi Pemetaan Kolom (Schema Mapping)
            </h5>
            <div style={{ overflowX: "auto", maxHeight: "300px" }}>
              <Table size="sm">
                <TableHead>
                  <TableRow>
                    <TableHeader>Nama Kolom</TableHeader>
                    <TableHeader>Jenis Data</TableHeader>
                    <TableHeader>Pemetaan Kunci</TableHeader>
                    <TableHeader>Baris Kosong</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(columns || []).map((col) => {
                    const isNumeric = profile?.numericColumns.includes(col);
                    const canonicalKey = detectCanonicalKey(col);
                    const missingObj = profile?.missingByColumn.find((m) => m.column === col);
                    const missingText = missingObj ? `${missingObj.missing} (${missingObj.percentage.toFixed(1)}%)` : "0 (0%)";

                    return (
                      <TableRow key={col}>
                        <TableCell style={{ fontWeight: 600 }}>{col}</TableCell>
                        <TableCell>{isNumeric ? "Numerik" : "Kategorikal"}</TableCell>
                        <TableCell>
                          {canonicalKey ? (
                            <Tag type="blue" size="sm" style={{ textTransform: "uppercase" }}>
                              {canonicalKey.replace("_", " ")}
                            </Tag>
                          ) : (
                            <span style={{ color: "var(--cds-text-muted, #8d8d8d)", fontSize: "0.75rem" }}>
                              Tidak Terpetakan
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{missingText}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
