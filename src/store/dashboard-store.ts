"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { calculateKpis, filterRows, generateProfile, getInsights, getRanking, normalizeRows, toProgramChart } from "@/lib/data-helpers";
import type { DashboardTabConnection } from "@/lib/dashboard-config";
import type { SheetConnection } from "@/lib/source-connection-types";
import type { DashboardFilters, DataProfile, NormalizedRow, RawRow } from "@/types/data";

const getInitialIkuTargets = () => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("iku-targets");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }
  return {
    "IKU 001": 80,
    "IKU 002": 80,
    "IKU 003": 80,
    "IKU 005": 80,
    "IKU 007": 80,
    "IKU 009": 80,
  };
};

type DashboardState = {
  rows: RawRow[];
  columns: string[];
  normalizedRows: NormalizedRow[];
  profile: DataProfile | null;
  parseStatus: "idle" | "loading" | "success" | "error";
  errorMessage: string | null;
  filters: DashboardFilters;
  kpiThreshold: number;
  ikuTargets: Record<string, number>;
  activeFileName: string;
  activeDashboardTab: string;
  sourceConnections: SheetConnection[];
  dashboardTabConnections: DashboardTabConnection[];
  areDashboardConnectionsReady: boolean;
  setData: (rows: RawRow[], columns: string[]) => void;
  setLoading: () => void;
  setError: (message: string) => void;
  setFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void;
  setKpiThreshold: (threshold: number) => void;
  setIkuTarget: (key: string, value: number) => void;
  setActiveFileName: (name: string) => void;
  setActiveDashboardTab: (tab: string) => void;
  setSourceConnections: (connections: SheetConnection[]) => void;
  setDashboardTabConnections: (connections: DashboardTabConnection[]) => void;
  setDashboardConnectionsReady: (ready: boolean) => void;
  resetFilters: () => void;
};

const initialFilters: DashboardFilters = {
  year: "",
  faculty: "",
  degree: "",
  search: "",
};

export const useDashboardStore = create<DashboardState>((set) => ({
  rows: [],
  columns: [],
  normalizedRows: [],
  profile: null,
  parseStatus: "idle",
  errorMessage: null,
  filters: initialFilters,
  kpiThreshold: getInitialIkuTargets()["IKU 003"],
  ikuTargets: getInitialIkuTargets(),
  activeFileName: "",
  activeDashboardTab: "Overview",
  sourceConnections: [],
  dashboardTabConnections: [],
  areDashboardConnectionsReady: false,
  setData: (rows, columns) =>
    set({
      rows,
      columns,
      normalizedRows: normalizeRows(rows),
      profile: generateProfile(rows, columns),
      parseStatus: "success",
      errorMessage: null,
    }),
  setLoading: () =>
    set({
      parseStatus: "loading",
      errorMessage: null
    }),
  setError: (message) => set({ parseStatus: "error", errorMessage: message }),
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    })),
  setKpiThreshold: (threshold) =>
    set((state) => {
      const nextTargets = { ...state.ikuTargets, "IKU 003": threshold };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("iku-targets", JSON.stringify(nextTargets));
        } catch {}
      }
      return { kpiThreshold: threshold, ikuTargets: nextTargets };
    }),
  setIkuTarget: (key, value) =>
    set((state) => {
      const nextTargets = { ...state.ikuTargets, [key]: value };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("iku-targets", JSON.stringify(nextTargets));
        } catch {}
      }
      const updateObj: Partial<DashboardState> = { ikuTargets: nextTargets };
      if (key === "IKU 003") {
        updateObj.kpiThreshold = value;
      }
      return updateObj;
    }),
  setActiveFileName: (name) => set({ activeFileName: name }),
  setActiveDashboardTab: (tab) => set({ activeDashboardTab: tab }),
  setSourceConnections: (sourceConnections) => set({ sourceConnections }),
  setDashboardTabConnections: (dashboardTabConnections) => set({ dashboardTabConnections }),
  setDashboardConnectionsReady: (areDashboardConnectionsReady) => set({ areDashboardConnectionsReady }),
  resetFilters: () => set({ filters: initialFilters }),
}));

export const useFilteredRows = () =>
  {
    const normalizedRows = useDashboardStore((state) => state.normalizedRows);
    const filters = useDashboardStore((state) => state.filters);
    return useMemo(() => filterRows(normalizedRows, filters), [normalizedRows, filters]);
  };

export const useDashboardMetrics = () => {
  const rows = useFilteredRows();
  const kpiThreshold = useDashboardStore((state) => state.kpiThreshold);
  return useMemo(
    () => ({
      kpis: calculateKpis(rows),
      chartData: toProgramChart(rows),
      rankingTop: getRanking(rows, "desc"),
      rankingBottom: getRanking(rows, "asc"),
      insights: getInsights(rows, kpiThreshold),
    }),
    [rows, kpiThreshold],
  );
};
