"use client";

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dropdown,
  Modal,
  SkeletonPlaceholder,
  SkeletonText,
  Tile,
} from "@carbon/react";
import { dashboardMenuItems, ikuDashboardDetails, type DashboardTabConnection } from "@/lib/dashboard-config";
import { useDashboardMetrics, useDashboardStore } from "@/store/dashboard-store";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { Iku003DashboardView, Iku003Skeleton } from "@/components/dashboard/dashboard-iku003-view";
import { Iku001Dashboard, Iku001Skeleton } from "@/components/dashboard/iku001-dashboard";
import { Iku002Dashboard, Iku002Skeleton } from "@/components/dashboard/dashboard-iku002-view";
import { Iku005DashboardView, Iku005Skeleton } from "@/components/dashboard/dashboard-iku005-view";
import { Iku007DashboardView, Iku007Skeleton } from "@/components/dashboard/dashboard-iku007-view";
import { Iku009DashboardView, Iku009Skeleton } from "@/components/dashboard/dashboard-iku009-view";

type ExistingConnectionOption = { id: string; label: string };

function getSessionUserEmail() {
  try {
    const rawUser = localStorage.getItem("iku-user-session");
    const user = rawUser ? JSON.parse(rawUser) : null;
    return user?.email ? String(user.email) : "";
  } catch {
    return "";
  }
}

function MainContentSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" }}>
        <Tile><SkeletonText heading width="70%" /><SkeletonText paragraph lineCount={2} width="90%" /></Tile>
        <Tile><SkeletonText heading width="70%" /><SkeletonText paragraph lineCount={2} width="90%" /></Tile>
        <Tile><SkeletonText heading width="70%" /><SkeletonText paragraph lineCount={2} width="90%" /></Tile>
        <Tile><SkeletonText heading width="70%" /><SkeletonText paragraph lineCount={2} width="90%" /></Tile>
      </div>
      <Tile style={{ minHeight: "220px" }}>
        <SkeletonText heading width="40%" />
        <SkeletonPlaceholder style={{ width: "100%", height: "160px", marginTop: "1rem" }} />
      </Tile>
      <Tile style={{ minHeight: "220px" }}>
        <SkeletonText heading width="40%" />
        <SkeletonPlaceholder style={{ width: "100%", height: "160px", marginTop: "1rem" }} />
      </Tile>
    </div>
  );
}

const MemoOverviewDashboard = memo(DashboardOverview);
const MemoPlaceholderDashboard = memo(DashboardPlaceholder);
const MemoIku003DashboardView = memo(Iku003DashboardView);
const MemoIku005DashboardView = memo(Iku005DashboardView);
const MemoIku007DashboardView = memo(Iku007DashboardView);
const MemoIku009DashboardView = memo(Iku009DashboardView);

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const { kpis, chartData, rankingTop, rankingBottom, insights } = useDashboardMetrics();
  const rows = useDashboardStore((state) => state.rows);
  const kpiThreshold = useDashboardStore((state) => state.kpiThreshold);
  const activeDashboardTab = useDashboardStore((state) => state.activeDashboardTab);
  const parseStatus = useDashboardStore((state) => state.parseStatus);
  const errorMessage = useDashboardStore((state) => state.errorMessage);
  const sourceConnections = useDashboardStore((state) => state.sourceConnections);
  const dashboardConnections = useDashboardStore((state) => state.dashboardTabConnections);
  const areDashboardConnectionsReady = useDashboardStore((state) => state.areDashboardConnectionsReady);
  const setDashboardTabConnections = useDashboardStore((state) => state.setDashboardTabConnections);

  const [selectedTile, setSelectedTile] = useState("kpi-1");
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);
  const [isConnectExistingModalOpen, setIsConnectExistingModalOpen] = useState(false);
  const [selectedExistingConnection, setSelectedExistingConnection] = useState<ExistingConnectionOption | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const previousTabRef = useRef(activeDashboardTab);

  const hasValidData = rows.length > 0 && chartData.length > 0;

  useEffect(() => {
    if (previousTabRef.current === activeDashboardTab) {
      return;
    }
    previousTabRef.current = activeDashboardTab;
    setIsSwitchLoading(true);
    const timeout = window.setTimeout(() => {
      setIsSwitchLoading(false);
    }, 280);
    return () => window.clearTimeout(timeout);
  }, [activeDashboardTab]);

  useEffect(() => {
    setUserEmail(getSessionUserEmail());
  }, []);

  const dashboardTabConnection = useMemo(
    () =>
      activeDashboardTab === "Overview"
        ? null
        : dashboardConnections.find((connection) => connection.dashboardTab === activeDashboardTab) ?? null,
    [activeDashboardTab, dashboardConnections]
  );

  const requestedTab = searchParams.get("tab")?.trim() ?? "";
  const requestedDashboardTab = (dashboardMenuItems as readonly string[]).includes(requestedTab) ? requestedTab : "";
  const requiresDashboardConnectionResolution =
    requestedDashboardTab !== "" &&
    requestedDashboardTab !== "Overview";
  const shouldShowDashboardInitialLoading =
    requestedDashboardTab !== "" &&
    requestedDashboardTab !== "Overview" &&
    (activeDashboardTab !== requestedDashboardTab ||
      (activeDashboardTab === requestedDashboardTab &&
        requiresDashboardConnectionResolution &&
        !areDashboardConnectionsReady));
  const initialDashboardLoadingFallback =
    requestedDashboardTab === "IKU 001" ? (
      <Iku001Skeleton />
    ) : requestedDashboardTab === "IKU 002" ? (
      <Iku002Skeleton />
    ) : requestedDashboardTab === "IKU 003" ? (
      <Iku003Skeleton />
    ) : requestedDashboardTab === "IKU 005" ? (
      <Iku005Skeleton />
    ) : requestedDashboardTab === "IKU 007" ? (
      <Iku007Skeleton />
    ) : requestedDashboardTab === "IKU 009" ? (
      <Iku009Skeleton />
    ) : (
      <MainContentSkeleton />
    );

  const existingConnectionOptions = useMemo(
    () =>
      sourceConnections.map((conn) => ({
        id: conn.id,
        label: conn.name
      })),
    [sourceConnections]
  );

  const rankingTopRows = useMemo(
    () =>
      rankingTop.slice(0, 10).map((row, index) => ({
        id: `top-${index}`,
        ...row,
        iku_percentage: (row.iku_percentage ?? 0).toFixed(2)
      })),
    [rankingTop]
  );

  const rankingBottomRows = useMemo(
    () =>
      rankingBottom.slice(0, 10).map((row, index) => ({
        id: `bot-${index}`,
        ...row,
        iku_percentage: (row.iku_percentage ?? 0).toFixed(2)
      })),
    [rankingBottom]
  );

  const pieData = useMemo(
    () =>
      Object.values(
        chartData.reduce<Record<string, { faculty: string; total: number }>>((acc, item) => {
          if (!acc[item.faculty]) acc[item.faculty] = { faculty: item.faculty, total: 0 };
          acc[item.faculty].total += 1;
          return acc;
        }, {}),
      ),
    [chartData],
  );

  const openUploadModal = useCallback(() => {
    setSelectedExistingConnection(null);
    setIsConnectExistingModalOpen(true);
  }, []);

  const handleSelectTile = useCallback((id: string) => {
    setSelectedTile(id);
  }, []);

  const handleConnectExistingSource = async () => {
    if (!selectedExistingConnection || !userEmail) return;

    if (activeDashboardTab !== "Overview") {
      const resp = await fetch("/api/dashboard-connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          dashboardTab: activeDashboardTab,
          sourceId: selectedExistingConnection.id,
          sourceLabel: selectedExistingConnection.label
        })
      });

      if (resp.ok) {
        const json = await resp.json();
        const nextConnection = json.connection as DashboardTabConnection | null;
        if (nextConnection) {
          const filtered = dashboardConnections.filter((connection) => connection.dashboardTab !== nextConnection.dashboardTab);
          setDashboardTabConnections([...filtered, nextConnection]);
        }
      }
    }

    window.dispatchEvent(
      new CustomEvent("app:select-source", {
        detail: { sourceId: selectedExistingConnection.id },
      }),
    );
    setIsConnectExistingModalOpen(false);
  };
  const activeIkuDetail =
    activeDashboardTab !== "Overview"
      ? ikuDashboardDetails[activeDashboardTab as keyof typeof ikuDashboardDetails]
      : undefined;

  return (
    <>
      {isSwitchLoading && <MainContentSkeleton />}

      {!isSwitchLoading && shouldShowDashboardInitialLoading && initialDashboardLoadingFallback}

      {/* View 1: Overview Dashboard */}
      {!isSwitchLoading && !shouldShowDashboardInitialLoading && activeDashboardTab === "Overview" && (
        <MemoOverviewDashboard
          kpis={kpis}
          hasValidData={hasValidData}
          threshold={kpiThreshold}
          onOpenUpload={openUploadModal}
          dashboardConnections={dashboardConnections}
        />
      )}

      {/* View 2: Detailed IKU 003 Dashboard */}
      {!isSwitchLoading && !shouldShowDashboardInitialLoading && activeDashboardTab === "IKU 003" && Boolean(dashboardTabConnection) && (
        <MemoIku003DashboardView
          rows={rows}
          parseStatus={parseStatus}
          errorMessage={errorMessage}
        />
      )}

      {/* View 2: Detailed IKU 005 Dashboard */}
      {!isSwitchLoading && !shouldShowDashboardInitialLoading && activeDashboardTab === "IKU 005" && Boolean(dashboardTabConnection) && (
        <MemoIku005DashboardView
          rows={rows}
          parseStatus={parseStatus}
          errorMessage={errorMessage}
        />
      )}

      {/* View 2: Detailed IKU 007 Dashboard */}
      {!isSwitchLoading && !shouldShowDashboardInitialLoading && activeDashboardTab === "IKU 007" && Boolean(dashboardTabConnection) && (
        <MemoIku007DashboardView
          rows={rows}
          parseStatus={parseStatus}
          errorMessage={errorMessage}
        />
      )}

      {/* View 2: Detailed IKU 009 Dashboard */}
      {!isSwitchLoading && !shouldShowDashboardInitialLoading && activeDashboardTab === "IKU 009" && Boolean(dashboardTabConnection) && (
        <MemoIku009DashboardView
          rows={rows}
          parseStatus={parseStatus}
          errorMessage={errorMessage}
        />
      )}

      {!isSwitchLoading && !shouldShowDashboardInitialLoading && activeDashboardTab === "IKU 001" && Boolean(dashboardTabConnection) && (
        <Iku001Dashboard rows={rows} parseStatus={parseStatus} errorMessage={errorMessage} />
      )}

      {!isSwitchLoading && !shouldShowDashboardInitialLoading && activeDashboardTab === "IKU 002" && Boolean(dashboardTabConnection) && (
        <Iku002Dashboard rows={rows} parseStatus={parseStatus} errorMessage={errorMessage} />
      )}

      {/* View 3: Other IKUs Placeholder Connect Portals */}
      {!isSwitchLoading && !shouldShowDashboardInitialLoading && activeDashboardTab !== "Overview" && !(activeDashboardTab === "IKU 001" && Boolean(dashboardTabConnection)) && !(activeDashboardTab === "IKU 002" && Boolean(dashboardTabConnection)) && !(activeDashboardTab === "IKU 003" && Boolean(dashboardTabConnection)) && !(activeDashboardTab === "IKU 005" && Boolean(dashboardTabConnection)) && !(activeDashboardTab === "IKU 007" && Boolean(dashboardTabConnection)) && !(activeDashboardTab === "IKU 009" && Boolean(dashboardTabConnection)) && activeIkuDetail && (
        <MemoPlaceholderDashboard
          ikuCode={activeDashboardTab}
          title={activeIkuDetail.title}
          description={activeIkuDetail.description}
          onOpenUpload={openUploadModal}
          hasConnection={Boolean(dashboardTabConnection)}
        />
      )}

      <Modal
        open={isConnectExistingModalOpen}
        modalHeading="Pilih Koneksi Data Eksisting"
        primaryButtonText={dashboardTabConnection ? "Ganti Koneksi" : "Gunakan Koneksi"}
        secondaryButtonText="Batal"
        onRequestClose={() => setIsConnectExistingModalOpen(false)}
        onRequestSubmit={() => { void handleConnectExistingSource(); }}
        primaryButtonDisabled={!selectedExistingConnection}
        size="sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "0.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--cds-text-secondary)", lineHeight: 1.5 }}>
            Pilih sumber data yang sudah terhubung untuk langsung digunakan pada dashboard ini.
          </p>
          <Dropdown
            id="overview-existing-connection"
            titleText="Daftar Koneksi"
            label={existingConnectionOptions.length > 0 ? "Pilih sumber data yang sudah terkoneksi" : "Belum ada koneksi tersimpan"}
            items={existingConnectionOptions}
            itemToString={(item) => item?.label || ""}
            selectedItem={selectedExistingConnection}
            onChange={({ selectedItem }) => setSelectedExistingConnection((selectedItem as ExistingConnectionOption) || null)}
            disabled={existingConnectionOptions.length === 0}
            size="md"
          />
        </div>
      </Modal>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<MainContentSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
