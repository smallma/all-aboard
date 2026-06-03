import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { CarColor, CarType, Plan, PlanMeta } from '@/lib/types';

export type DragRejectInfo = {
  carId: string;
  reason: 'driver-cannot-drive';
  passengerName: string;
};

export type DragKind = 'passenger' | 'item' | null;

export type ViewMode = 'visual' | 'text';

export type UiState = {
  stagingCollapsed: boolean;
  consoleCollapsed: boolean;
  toasts: { id: string; message: string; createdAt: number }[];
  rejectFlash: DragRejectInfo | null;        // 駕駛防呆即時震動的目標（dragEnd 觸發）
  hoverInvalidDriverCarId: string | null;    // 拖曳中目前 hover 的非法駕駛座（dragOver 觸發）
  draggingKind: DragKind;                    // 拖曳中：人/物/無，用於高亮可放區
  viewMode: ViewMode;                        // 編輯器主畫面：視覺 / 文字
};

export type PlanStoreState = {
  // 安排清單
  planMetas: PlanMeta[];
  metasLoaded: boolean;

  // 編輯中的安排
  currentPlanId: string | null;
  currentPlan: Plan | null;

  // UI
  ui: UiState;
};

export type PlanStoreActions = {
  setPlanMetas: (metas: PlanMeta[]) => void;
  setCurrentPlan: (plan: Plan | null) => void;
  updateCurrentPlan: (updater: (plan: Plan) => Plan) => void;

  // UI helpers
  setStagingCollapsed: (v: boolean) => void;
  setConsoleCollapsed: (v: boolean) => void;
  pushToast: (message: string) => void;
  dismissToast: (id: string) => void;
  flashReject: (info: DragRejectInfo | null) => void;
  setHoverInvalidDriver: (carId: string | null) => void;
  setDraggingKind: (kind: DragKind) => void;
  setViewMode: (mode: ViewMode) => void;
};

export type PlanStore = PlanStoreState & PlanStoreActions;

const initialUi: UiState = {
  stagingCollapsed: false,
  consoleCollapsed: false,
  toasts: [],
  rejectFlash: null,
  hoverInvalidDriverCarId: null,
  draggingKind: null,
  viewMode: 'visual',
};

export const usePlanStore = create<PlanStore>()(
  subscribeWithSelector((set) => ({
    planMetas: [],
    metasLoaded: false,
    currentPlanId: null,
    currentPlan: null,
    ui: initialUi,

    setPlanMetas: (metas) => set({ planMetas: metas, metasLoaded: true }),
    setCurrentPlan: (plan) =>
      set({ currentPlan: plan, currentPlanId: plan?.id ?? null }),
    updateCurrentPlan: (updater) =>
      set((state) => {
        if (!state.currentPlan) return state;
        const next = updater(state.currentPlan);
        return { currentPlan: { ...next, updatedAt: Date.now() } };
      }),

    setStagingCollapsed: (v) =>
      set((state) => ({ ui: { ...state.ui, stagingCollapsed: v } })),
    setConsoleCollapsed: (v) =>
      set((state) => ({ ui: { ...state.ui, consoleCollapsed: v } })),

    pushToast: (message) =>
      set((state) => ({
        ui: {
          ...state.ui,
          toasts: [
            ...state.ui.toasts,
            { id: crypto.randomUUID(), message, createdAt: Date.now() },
          ],
        },
      })),
    dismissToast: (id) =>
      set((state) => ({
        ui: { ...state.ui, toasts: state.ui.toasts.filter((t) => t.id !== id) },
      })),
    flashReject: (info) =>
      set((state) => ({ ui: { ...state.ui, rejectFlash: info } })),
    setHoverInvalidDriver: (carId) =>
      set((state) => ({ ui: { ...state.ui, hoverInvalidDriverCarId: carId } })),
    setDraggingKind: (kind) =>
      set((state) => ({ ui: { ...state.ui, draggingKind: kind } })),
    setViewMode: (mode) =>
      set((state) => ({ ui: { ...state.ui, viewMode: mode } })),
  })),
);

// 重新匯出常用型別，避免外部 import 太散
export type { CarColor, CarType, Plan, PlanMeta };
