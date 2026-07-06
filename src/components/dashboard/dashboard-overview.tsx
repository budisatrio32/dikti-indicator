"use client";

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag, Tile, SkeletonText, SkeletonPlaceholder } from "@carbon/react";
import { overviewDashboardItems, type DashboardTabConnection } from "@/lib/dashboard-config";

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
};

export function DashboardOverview({ kpis, hasValidData, threshold, onOpenUpload, dashboardConnections, isLoading = false }: Props) {
  const renderChannelAction = (isConnected: boolean) => {
    if (isConnected) {
      return (
        <Button kind="tertiary" size="sm" onClick={onOpenUpload}>
          Kelola Koneksi
        </Button>
      );
    }

    return (
      <Button kind="ghost" size="sm" onClick={onOpenUpload}>
        Hubungkan
      </Button>
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
            <div className="iku-kpi-tile__label">Rata-rata Kinerja (IKU 003)</div>
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
          <div className="iku-kpi-tile__label">Rata-rata Kinerja (IKU 003)</div>
          <div className="iku-kpi-tile__value" style={{ color: hasValidData && kpis.avgIkuPercentage >= threshold ? "#198038" : "inherit" }}>
            {hasValidData ? `${kpis.avgIkuPercentage.toFixed(2)}%` : "0.00%"}
          </div>
          <div className="iku-kpi-tile__subtext">Target kelulusan ambang batas: {threshold}%</div>
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
                  <TableCell>{renderChannelAction(item.isConnected)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Tile>
    </div>
  );
}
