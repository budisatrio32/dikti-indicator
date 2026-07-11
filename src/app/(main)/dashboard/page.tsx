"use client";

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Modal,
  SkeletonPlaceholder,
  SkeletonText,
  Tile,
  StructuredListWrapper,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
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

// Component and Skeleton Registry for IKU Tabs
type IkuRegistryItem = {
  Component: React.ComponentType<{
    rows: any[];
    parseStatus: "idle" | "loading" | "success" | "error";
    errorMessage: string | null;
  }>;
  Skeleton: React.ComponentType<{}>;
};

const IKU_REGISTRY: Record<string, IkuRegistryItem> = {
  "IKU 001": { Component: memo(Iku001Dashboard), Skeleton: Iku001Skeleton },
  "IKU 002": { Component: memo(Iku002Dashboard), Skeleton: Iku002Skeleton },
  "IKU 003": { Component: memo(Iku003DashboardView), Skeleton: Iku003Skeleton },
  "IKU 005": { Component: memo(Iku005DashboardView), Skeleton: Iku005Skeleton },
  "IKU 007": { Component: memo(Iku007DashboardView), Skeleton: Iku007Skeleton },
  "IKU 009": { Component: memo(Iku009DashboardView), Skeleton: Iku009Skeleton },
};

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const { kpis, chartData, rankingTop, rankingBottom, insights } = useDashboardMetrics();
  const rows = useDashboardStore((state) => state.rows);
  const kpiThreshold = useDashboardStore((state) => state.kpiThreshold);
  const ikuTargets = useDashboardStore((state) => state.ikuTargets);
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
  const [connectingTab, setConnectingTab] = useState<string | null>(null);
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
  const initialDashboardLoadingFallback = useMemo(() => {
    const registryItem = IKU_REGISTRY[requestedDashboardTab];
    if (registryItem) {
      const SkeletonComponent = registryItem.Skeleton;
      return <SkeletonComponent />;
    }
    return <MainContentSkeleton />;
  }, [requestedDashboardTab]);

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

  const openUploadModal = useCallback((tab: string) => {
    setConnectingTab(tab);
    setSelectedExistingConnection(null);
    setIsConnectExistingModalOpen(true);
  }, []);

  const handleSelectTile = useCallback((id: string) => {
    setSelectedTile(id);
  }, []);

  const handleConnectExistingSource = async () => {
    const email = getSessionUserEmail();
    if (!selectedExistingConnection || !email) return;

    const targetTab = connectingTab || activeDashboardTab;

    if (targetTab && targetTab !== "Overview") {
      const resp = await fetch("/api/dashboard-connections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: email,
          dashboardTab: targetTab,
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
    setConnectingTab(null);
  };

  const handleDisconnectConnection = async (tab: string) => {
    const email = getSessionUserEmail();
    if (!email) return;

    try {
      const resp = await fetch(`/api/dashboard-connections?userEmail=${encodeURIComponent(email)}&dashboardTab=${encodeURIComponent(tab)}`, {
        method: "DELETE"
      });

      if (resp.ok) {
        const filtered = dashboardConnections.filter((connection) => connection.dashboardTab !== tab);
        setDashboardTabConnections(filtered);
        
        window.dispatchEvent(
          new CustomEvent("app:select-source", {
            detail: { sourceId: null },
          }),
        );
      }
    } catch (error) {
      console.error("Failed to disconnect dataset:", error);
    }
  };

  const activeIkuDetail =
    activeDashboardTab !== "Overview"
      ? ikuDashboardDetails[activeDashboardTab as keyof typeof ikuDashboardDetails]
      : undefined;

  return (
    <>
      {isSwitchLoading && activeDashboardTab !== "Overview" && <MainContentSkeleton />}

      {!isSwitchLoading && shouldShowDashboardInitialLoading && initialDashboardLoadingFallback}

      {/* View 1: Overview Dashboard */}
      {activeDashboardTab === "Overview" && (
        <MemoOverviewDashboard
          kpis={kpis}
          hasValidData={hasValidData}
          threshold={kpiThreshold}
          onOpenUpload={openUploadModal}
          dashboardConnections={dashboardConnections}
          isLoading={!areDashboardConnectionsReady || parseStatus === "loading" || isSwitchLoading}
          ikuTargets={ikuTargets}
          onDisconnect={handleDisconnectConnection}
        />
      )}

      {/* View 2: Detailed Registered IKU Dashboard or Connection Placeholder */}
      {!isSwitchLoading && !shouldShowDashboardInitialLoading && activeDashboardTab !== "Overview" && (() => {
        const registryItem = IKU_REGISTRY[activeDashboardTab];
        const hasConnection = Boolean(dashboardTabConnection);

        if (registryItem && hasConnection) {
          const IkuComponent = registryItem.Component;
          return (
            <IkuComponent
              rows={rows}
              parseStatus={parseStatus}
              errorMessage={errorMessage}
            />
          );
        }

        if (activeIkuDetail) {
          return (
            <MemoPlaceholderDashboard
              ikuCode={activeDashboardTab}
              title={activeIkuDetail.title}
              description={activeIkuDetail.description}
              onOpenUpload={() => openUploadModal(activeDashboardTab)}
              hasConnection={hasConnection}
            />
          );
        }

        return null;
      })()}

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
          {existingConnectionOptions.length > 0 ? (
            <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--cds-border-subtle-01)", marginTop: "0.5rem" }}>
              <StructuredListWrapper selection aria-label="Daftar Koneksi">
                <StructuredListBody>
                  {existingConnectionOptions.map((option) => {
                    const isSelected = selectedExistingConnection?.id === option.id;
                    return (
                      <StructuredListRow
                        key={option.id}
                        onClick={() => setSelectedExistingConnection(option)}
                        style={{
                          cursor: "pointer",
                          backgroundColor: isSelected ? "var(--cds-layer-selected-01)" : undefined
                        }}
                      >
                        <StructuredListCell style={{ fontWeight: 600 }}>{option.label}</StructuredListCell>
                        <StructuredListCell style={{ color: isSelected ? "#0f62fe" : "var(--cds-text-secondary)", fontSize: "0.75rem", textAlign: "right", fontWeight: isSelected ? 600 : undefined }}>
                          {isSelected ? "Terpilih" : `ID: ${option.id}`}
                        </StructuredListCell>
                      </StructuredListRow>
                    );
                  })}
                </StructuredListBody>
              </StructuredListWrapper>
            </div>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", textAlign: "center", margin: "1.5rem 0" }}>
              Belum ada koneksi tersimpan. Silakan sambungkan dataset baru terlebih dahulu.
            </p>
          )}
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
