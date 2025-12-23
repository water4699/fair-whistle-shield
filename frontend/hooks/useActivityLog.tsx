"use client";

import { create } from "zustand";

export type ActivityLogEntry = {
  id: string;
  type: "report_submit" | "decrypt" | "error" | "info";
  title: string;
  details?: string;
  ts: number;
};

type ActivityLogStore = {
  entries: ActivityLogEntry[];
  add: (entry: Omit<ActivityLogEntry, "id" | "ts">) => void;
  clear: () => void;
};

export const useActivityLog = create<ActivityLogStore>((set) => ({
  entries: [],
  add: (entry) =>
    set((state) => ({
      entries: [
        ...state.entries,
        {
          ...entry,
          id: `${Date.now()}-${Math.random()}`,
          ts: Date.now(),
        },
      ],
    })),
  clear: () => set({ entries: [] }),
}));
