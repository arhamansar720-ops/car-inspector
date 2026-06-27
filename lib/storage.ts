import type { StoredInspection, ListingData, DefectReport } from "./types";

const STORAGE_KEY = "inspector_history";
const MAX_HISTORY = 10;

export function saveInspection(listing: ListingData): void {
  const history = loadAllInspections();
  const existing = history.findIndex((h) => h.listing.id === listing.id);
  if (existing >= 0) {
    history[existing].listing = listing;
  } else {
    history.unshift({ listing });
    if (history.length > MAX_HISTORY) history.pop();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function saveDefectReport(id: string, report: DefectReport): void {
  const history = loadAllInspections();
  const entry = history.find((h) => h.listing.id === id);
  if (entry) {
    entry.defectReport = report;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
}

export function loadInspection(id: string): StoredInspection | null {
  const history = loadAllInspections();
  return history.find((h) => h.listing.id === id) ?? null;
}

export function loadAllInspections(): StoredInspection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredInspection[];
  } catch {
    return [];
  }
}

export function clearInspection(id: string): void {
  const history = loadAllInspections().filter((h) => h.listing.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
