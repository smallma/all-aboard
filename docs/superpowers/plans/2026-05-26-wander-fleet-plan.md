# Wander-Fleet 實作計畫

**Spec**: docs/superpowers/specs/2026-05-26-wander-fleet-design.md
**Date**: 2026-05-26
**Mode**: Subagent-driven, /loop 無人值守

## 角色分工

| Agent | 職責 |
|---|---|
| claude | 主架構師、核心邏輯（Store / dragdrop / Persist）、整合、**所有 codex 產出的 Code Review** |
| codex  | UI 元件初稿（純呈現元件）、素材處理、量測類雜事 |

### 分工準則

- **codex 適合做**：邏輯簡單、I/O 明確、好 review、不跨檔案的元件或腳本
- **claude 必做**：跨檔案邏輯、業務規則（防呆/swap/sync）、整合、debug

### 必讀檔案

- `docs/agents/coding-conventions.md` — codex 每輪必讀
- `docs/agents/README.txt` — 協作協議與 review 流程

## 任務切分原則

- 每個 task 設計成可在單一 /loop session 內完成（< 15 分鐘）
- codex task 必須附明確 INTERFACE + ACCEPTANCE
- 每個 task 完成後寫進度到 `docs/agents/shared-log.txt`
- 任務之間透過檔案連動，不依賴對話記憶
- 失敗就在 task 末尾標 BLOCKED + 原因，下輪重試
- codex 產出 100% 必經 claude review

---

## Phase 0：基礎建設（可平行）

### T0.1 [claude] Next.js 專案初始化
- `npx create-next-app@latest` 在 `all-aboard/` 內，TypeScript + Tailwind + App Router + src dir
- 安裝套件：`@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities framer-motion lucide-react zustand dexie clsx`
- 確認 `npm run dev` 可啟動

### T0.2 [codex] 素材搬移
- 從 `src/image/vehicles/` 複製 8 個 PNG 到 `public/vehicles/`
- 從 `src/image/Avatar/` 複製 48 個 PNG + manifest.json 到 `public/avatars/`
- 確認檔名格式：`animal-NN.png`, `asian-NN.png`, `avatar-NN.png`
- 回報實際檔案清單到 claude-inbox.txt

### T0.3 [codex] 量測車輛 PNG 上的座位/後車廂座標
- 對每張 base PNG (sedan/mpv/cargo-van/pickup-truck)，量測：
  - 駕駛座中心點 (xPct, yPct)
  - 副駕/後座每個位子中心點 (xPct, yPct) 與順序索引
  - 後車廂矩形 (xPct, yPct, wPct, hPct)
- xPct/yPct 為相對 PNG 寬高的百分比 (0~100)
- 結果寫入 `docs/agents/seat-coordinates.json`，格式：
  ```json
  {
    "轎車": {
      "driver": { "xPct": 38, "yPct": 22 },
      "seats": [
        { "index": 0, "label": "副駕", "xPct": 62, "yPct": 22 },
        ...
      ],
      "trunk": { "xPct": 50, "yPct": 85, "wPct": 50, "hPct": 18 }
    },
    ...
  }
  ```
- claude 收到後接進 `lib/constants.ts` 的 `CAR_SPECS`

## Phase 1：型別與工具層

### T1.1 [claude] lib/types.ts
- 完整型別定義（Passenger / Item / CarType / CarColor / Car / Plan）
- 從 spec §2.1 抄

### T1.2 [claude] lib/constants.ts
- `CAR_SPECS`（先用 placeholder，等 T0.3 完成補真實座標）
- `COLOR_HEX`
- `AVATAR_LIST`（從 T0.2 manifest.json 讀出來的 ID 陣列）
- `TEMPLATE_PLAN`

### T1.3 [claude] lib/id.ts + lib/dnd-id.ts
- `uuid()` = `crypto.randomUUID()`
- `buildDndId({ kind, ... })` + `parseDndId(string)`

## Phase 2：儲存層

### T2.1 [claude] lib/db.ts (Dexie schema + planRepo)
### T2.2 [claude] lib/import-export.ts (JSON export/import + validatePlanShape type guard)
### T2.3 [claude] lib/persist.ts (debounce 300ms 寫回機制)

## Phase 3：Store

### T3.1 [claude] store/usePlanStore.ts 骨架
### T3.2 [claude] store/actions/plans.ts (create/duplicate/delete/rename/import)
### T3.3 [claude] store/actions/passengers.ts (CRUD + 從車上移除)
### T3.4 [claude] store/actions/items.ts (CRUD + 從車上移除)
### T3.5 [claude] store/actions/cars.ts (CRUD + 刪除時退人退物)
### T3.6 [claude] store/actions/dragdrop.ts ⚠️ 核心
- 實作 spec §4.2-4.5 的全部來源/目標矩陣
- handleDragEnd(active, over)
- 駕駛防呆、空位優先填、swap 演算法
- 含 unit test 思考（用 console.log 跑幾種情境驗證）

## Phase 4：UI 框架

### T4.1 [claude] app/layout.tsx + app/globals.css (Tailwind 基底)
### T4.2 [claude] app/page.tsx + components/plans/PlanListView.tsx + PlanCard.tsx
### T4.3 [claude] components/plans/NewPlanDialog.tsx + ImportDropZone.tsx
### T4.4 [claude] app/plan/[id]/page.tsx + components/editor/EditorLayout.tsx + TopBar.tsx

## Phase 5：核心元件

### T5.1 [codex] components/shared/Avatar.tsx (吃 avatarId 渲染 PNG)
### T5.2 [claude] components/shared/Dialog.tsx (通用彈窗 + framer-motion)
### T5.3 [claude] components/canvas/CarBody.tsx ⚠️ 視覺核心
- base PNG 底層
- mask PNG 用 CSS mask-image + 顏色背景疊上染色
- 實作技巧：
  ```tsx
  <div className="relative">
    <img src={baseSrc} />
    <div
      className="absolute inset-0 mix-blend-multiply"
      style={{
        backgroundColor: COLOR_HEX[color],
        WebkitMaskImage: `url(${maskSrc})`,
        maskImage: `url(${maskSrc})`,
        WebkitMaskSize: 'cover',
        maskSize: 'cover',
      }}
    />
  </div>
  ```

### T5.4 [claude] components/canvas/CarView.tsx
- 包 CarBody + 疊上 DriverSeat / SeatSlot / Trunk / OwnerBadge / CarMenu
- 用 framer-motion `motion.div` + AnimatePresence

### T5.5 [codex] DriverSeat.tsx + SeatSlot.tsx + Trunk.tsx (droppable 區域)
- 純 droppable 容器，業務邏輯在 store
- claude review 重點：useDroppable 用對 dnd-id、無業務邏輯洩漏

### T5.6 [codex] OwnerBadge.tsx + CarMenu.tsx
- 純呈現 + 簡單事件

## Phase 6：側欄

### T6.1 [codex] components/staging/PassengerChip.tsx + ItemChip.tsx
- 三種 placement 視覺（staging/driver/seat），純呈現
### T6.1b [claude] components/staging/StagingPanel.tsx (整合 + droppable + store 串接)
### T6.2 [codex] components/staging/AvatarPicker.tsx (48 張 grid)
### T6.3 [claude] components/staging/AddPassengerDialog.tsx + AddItemDialog.tsx
### T6.4 [claude] components/console/ControlConsole.tsx + AddCarButton.tsx + NewCarDialog.tsx

## Phase 7：整合與動畫

### T7.1 [claude] 編輯頁串接：DndContext 包外層、connect store
### T7.2 [claude] hooks/usePlanSync.ts (mount 載入、unmount flush)
### T7.3 [claude] hooks/useToast.ts + ToastHost.tsx
### T7.4 [claude] framer-motion 動畫全套套用 (spec §5 全部)
### T7.5 [claude] 駕駛拒絕特效（即時亮紅燈 + 震動 + toast）

## Phase 8：RWD + 邊界

### T8.1 [claude] hooks/useIsMobile.ts + 側欄收合
### T8.2 [claude] 手機版 bottom sheet
### T8.3 [claude] 空狀態 / 無此 plan 跳回首頁 / 匯入錯誤 toast

## Phase 9：收尾

### T9.1 [claude] 視覺微調、配色精修
### T9.2 [claude] 部署到 Vercel preview
### T9.3 [claude] 寫終止信號到 codex-inbox.txt
- 在 codex-inbox.txt 末尾追加一整行：`>>> ALL_TASKS_COMPLETE_STOP_MONITORING <<<`
- shell loop 偵測到此行即退出

---

## /loop 啟動指令

claude 端：
```
/loop 15m 讀 docs/superpowers/plans/2026-05-26-wander-fleet-plan.md 找下一個 pending task，執行完寫進 docs/agents/shared-log.txt。同時讀 docs/agents/claude-inbox.txt 看 codex 是否有交付/問題。若全部 phase 完成就在 codex-inbox.txt 寫 [ALL TASKS COMPLETE - STOP MONITORING] 並 /loop stop。
```

codex 端（透過 shell loop 包）：
```
讀 docs/agents/codex-inbox.txt 中 STATUS: PENDING 的任務，依規格執行。完工寫 STATUS: DONE 與 RESULT。寫到 claude-inbox.txt 通知 claude。看到 [ALL TASKS COMPLETE - STOP MONITORING] 就 touch docs/agents/.stop 後退出。
```
