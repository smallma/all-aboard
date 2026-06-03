# Wander-Fleet 設計文件

**Date**: 2026-05-26
**Status**: Approved (Sections 1-3 by user; 4-6 self-finalized)

## 0. 產品定位

Wander-Fleet 是「出遊車位動態分配」Web App，核心體驗是**微縮汽車打包模擬器**：使用者把人和物品用拖曳分配到多輛車，車身以可愛的高空俯視 PNG 呈現，每個座位是透明 droppable 區域，配上絲滑的 framer-motion 動畫。資料用 IndexedDB 持久化，支援多份「安排」管理、複製、JSON 匯入匯出。

## 1. 系統架構

### 1.1 三層職責

| 層 | 職責 |
|---|---|
| UI 元件層 | 純呈現 + 接收事件，從 store 讀 state、呼叫 actions。不直接碰 Dexie。 |
| Store 層 (Zustand) | 所有業務邏輯（座位衝突、駕駛防呆、swap 演算法）+ 純記憶體狀態。 |
| Persistence 層 (Dexie) | 把 store 變化異步寫回 IndexedDB；提供 plan list / load / save。 |

### 1.2 路由

- `/` 安排清單首頁 (SSR shell + client hydration 從 Dexie 讀 plans)
- `/plan/[id]` 編輯器頁（`'use client'`）

### 1.3 為什麼這樣切

拖曳對延遲敏感，純記憶體 Zustand 確保拖曳零延遲；Dexie debounce 寫回（300ms）。Dexie 單一職責：跨安排切換 + 持久化。

## 2. 資料模型

### 2.1 核心型別 (lib/types.ts)

```ts
export type Passenger = {
  id: string;
  name: string;
  canDrive: boolean;
  avatarId: string;       // 'animal-01' | 'asian-03' | 'avatar-15' | ...
};

export type Item = {
  id: string;
  name: string;
};

export type CarType = '轎車' | 'MPV' | '貨車' | '皮卡';
export type CarColor = '黑' | '白' | '灰' | '紅' | '藍' | '綠';

export type Car = {
  id: string;
  type: CarType;
  color: CarColor;
  driverId: string | null;
  passengerIds: (string | null)[];     // 長度依車型固定
  itemIds: string[];                    // 後車廂物品，有順序，無上限
};

export type Plan = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  passengers: Passenger[];
  items: Item[];
  cars: Car[];
};
```

### 2.2 車型常數

```ts
type SeatPosition = {
  index: number;
  xPct: number;            // 0-100，相對於車身 PNG 寬度
  yPct: number;
  label: string;
};

export const CAR_SPECS: Record<CarType, {
  seatCount: number;
  layout: SeatPosition[];
  driverPos: { xPct: number; yPct: number };
  imageBase: string;
  imageMask: string;
  trunkLayout: { xPct: number; yPct: number; wPct: number; hPct: number };
}>;
```

座位數：
- 轎車 = 4（副駕 1 + 後排 3）
- MPV = 6（副駕 1 + 中排 2 + 後排 3）
- 貨車 = 1（副駕 1）
- 皮卡 = 1（副駕 1）

實際 xPct/yPct 座標於實作期間對照 PNG 量測，spec 不寫死。

### 2.3 色票

```ts
export const COLOR_HEX: Record<CarColor, string> = {
  黑: '#1f2937', 白: '#f9fafb', 灰: '#9ca3af',
  紅: '#ef4444', 藍: '#3b82f6', 綠: '#22c55e',
};
```

### 2.4 dnd-kit ID 規格

```
Draggable:
  passenger:{passengerId}
  item:{itemId}

Droppable:
  staging-passengers
  staging-items
  car:{carId}:driver
  car:{carId}:seat:{seatIndex}
  car:{carId}:trunk
```

`lib/dnd-id.ts` 提供 `buildDndId()` / `parseDndId()` 工具，避免字串散落。

### 2.5 範本資料

```ts
export const TEMPLATE_PLAN = {
  name: '範本安排',
  passengers: [
    { name: 'Rain', canDrive: true,  avatarId: 'avatar-01' },
    { name: 'S',    canDrive: false, avatarId: 'animal-02' },
    { name: 'N',    canDrive: true,  avatarId: 'asian-03' },
    { name: 'L',    canDrive: false, avatarId: 'avatar-04' },
    { name: 'Ming', canDrive: false, avatarId: 'animal-05' },
  ],
  items: [{ name: '28吋大行李' }, { name: '烤肉架' }],
  cars: [],
};
```

## 3. 模組劃分

完整目錄樹見 brainstorming 對話。重點：

- `src/app/` — Next.js 路由（清單頁、編輯頁）
- `src/components/plans/` — 清單頁元件
- `src/components/editor/` — 編輯頁外框
- `src/components/staging/` — 右側備戰區
- `src/components/console/` — 左側控制台
- `src/components/canvas/` — 中央畫布與單車元件（CarView、CarBody、DriverSeat、SeatSlot、Trunk、OwnerBadge）
- `src/components/shared/` — Avatar、DragOverlay、Dialog
- `src/lib/` — types、constants、db、persist、import-export、dnd-id
- `src/store/` — usePlanStore + actions/{plans, passengers, items, cars, dragdrop}
- `src/hooks/` — usePlanSync、useIsMobile、useToast

素材搬移：
- `src/image/vehicles/` → `public/vehicles/`
- `src/image/Avatar/` → `public/avatars/`

YAGNI（不會建立）：services 抽象層、models class、utils 雜物倉庫、自製 EventBus、i18n、主題切換、測試框架。

第三方套件：next15、react19、@dnd-kit/{core,sortable,utilities}、framer-motion、lucide-react、zustand、dexie、clsx。

## 4. 互動流程

### 4.1 拖曳引擎

唯一 `<DndContext>` 包在編輯頁最外層。所有 droppable / draggable 透過 `useDroppable` / `useDraggable` 註冊。`onDragEnd` 進入 `store/actions/dragdrop.ts` 的 `handleDragEnd(active, over)`，根據 source/target 的 dnd-id 進入不同分支。

### 4.2 來源/目標矩陣

| Source \ Target | staging-passengers | staging-items | car:driver | car:seat | car:trunk |
|---|---|---|---|---|---|
| passenger (from staging) | no-op | reject | driver check | empty-fill or swap | reject |
| passenger (from seat/driver) | unseat | reject | driver check + swap | empty-fill or swap | reject |
| item (from staging) | reject | no-op | reject | reject | append |
| item (from trunk) | reject | unstow | reject | reject | reorder or move-between-cars |

### 4.3 駕駛座防呆 (driver check)

`canDrive === false` 的人拖到任何 `car:*:driver`：

1. dragOver 時即時偵測 → 把該 droppable 標為「invalid」(border 變紅色 + 不允許 drop 游標)
2. 使用者放開後仍判斷 invalid → 不更新狀態，觸發：
   - 整台車身 framer-motion `x: [-4, 4, -3, 3, 0]` 震動 300ms
   - Toast 顯示「{name} 不會開車」3 秒
   - 拖曳卡片 spring 回原位

合法駕駛（`canDrive === true`）拖入：
- 駕駛座空 → 直接坐進去
- 駕駛座已有人且新人也會開車 → swap（原駕駛去新人原本的位置；若新人來自備戰區，原駕駛回備戰區）

### 4.4 座位衝突 (empty-fill or swap)

人拖到 `car:{carId}:seat:{idx}`，演算法：

```
target car = cars[carId]
if target seat (passengerIds[idx]) is empty:
  put passenger into passengerIds[idx]
else:
  // 已被佔用，先看其他位有沒有空
  emptyIdx = passengerIds.findIndex(x => x === null)
  if emptyIdx >= 0:
    put passenger into passengerIds[emptyIdx]
  else:
    // 全滿，swap
    occupant = passengerIds[idx]
    passengerIds[idx] = passenger.id
    place occupant back to passenger's previous location
```

「previous location」=
- 若 source = staging → occupant 回 staging
- 若 source = same car 的另一個 seat → swap 兩 index
- 若 source = 別車的 seat → occupant 去 source car 的 source seat
- 若 source = 駕駛座 → occupant 進駕駛座（仍要過 canDrive 檢查；若 occupant 不會開車，整個 swap 動作取消，視為 invalid）

### 4.5 後車廂

- 物品從備戰區 → 拖到 trunk → append 到 `itemIds` 末端
- 物品從 trunk → trunk 內部排序（dnd-kit sortable，僅同車內）
- 物品從 trunk A → trunk B → 從 A.itemIds 移除、加到 B.itemIds 末端
- 物品從 trunk → staging-items → 從 itemIds 移除
- 拖人到 trunk = reject（人不能進後車廂）

### 4.6 點 ✕ 快速移除

座位上的人/物 hover 時右上角顯示小 ✕ icon。點擊 = 直接退回備戰區，跳過拖曳流程。

### 4.6.1 PassengerChip 在不同位置的視覺差異

`<PassengerChip>` 元件接受 `placement: 'staging' | 'driver' | 'seat'` prop：

- `staging`：圓角標籤 + avatar + 名字；會開車則 name 右側加 💳
- `driver`：avatar 上加 👨‍✈️ 駕駛員圖示；名字略小或不顯示（PNG 駕駛座空間有限）
- `seat`：avatar + 名字（更小尺寸以塞進座位 droppable 區）

hover 顯示 ✕ 移除按鈕（僅 `driver` 和 `seat`）。

### 4.7 車主招牌邏輯

```ts
function getCarTitle(car: Car, plan: Plan): string {
  if (car.driverId === null) return '請指派司機';
  const driver = plan.passengers.find(p => p.id === car.driverId);
  return driver ? `${driver.name} 的車` : '請指派司機';
}
```

### 4.8 車輛 CRUD

- 新增：彈窗選車型 + 選色 → 生成空車 push 到 `cars[]`
- 刪除：彈出確認 → 該車的 driverId/passengerIds/itemIds 對應的人和物退回備戰區 → 從 cars[] 移除
- 改色：CarMenu 點開色票 → 直接更新 `car.color`

### 4.9 乘客 CRUD

- 新增：彈窗輸入 name、勾 canDrive、選 avatar（AvatarPicker grid 48 張）
- 編輯：點備戰區的人/車上的人 → 編輯彈窗（同表單，pre-fill）
- 刪除：編輯彈窗內有「刪除」按鈕；若該乘客在某車上，自動從該車移除

### 4.10 物品 CRUD

- 新增：彈窗輸入 name（不選 icon，統一 Package）
- 編輯：點物品標籤 → 編輯名稱
- 刪除：編輯彈窗的「刪除」按鈕；若在某車後車廂，自動移除

### 4.11 RWD 與側欄收合

- `useIsMobile()` 根據 `window.innerWidth` 判斷 (`< 768` mobile、`< 1024` tablet)
- 桌面：左控制台、中畫布、右備戰區三欄；每欄 header 有「<」「>」收合鈕
- 平板：兩欄並排（控制台+備戰區可變抽屜）
- 手機：所有側欄改成 bottom sheet / drawer；車輛在主畫布縱向堆疊（每排 1 台）
- 畫布車輛排列：桌面 grid-cols-3、平板 grid-cols-2、手機 grid-cols-1
- 側欄收合狀態存在 Zustand `ui.staging.collapsed` / `ui.console.collapsed`（不持久化，每次重整恢復預設）

## 5. 動畫清單 (framer-motion)

| 場景 | 元件 | Variant / Transition |
|---|---|---|
| 新增車輛掉落彈跳 | CarView | `initial={{ y: -120, scale: 0.8 }}`、`animate={{ y: 0, scale: 1 }}`、`transition={{ type: 'spring', stiffness: 260, damping: 18 }}` |
| 人/物拖入合法座位 | PassengerChip / ItemChip on seat | `whileTap`、`layout`、放下時 `scale: [1, 1.15, 1]` 0.25s |
| 招牌變化 | OwnerBadge | `AnimatePresence` + key={car.driverId}，新字串 `initial={{ y: -8, opacity: 0 }}` 彈進 |
| 駕駛拒絕震動 | CarView | `animate={{ x: [-4, 4, -3, 3, 0] }}` `transition={{ duration: 0.3 }}`（由 controls.start 觸發） |
| 刪除車輛淡出 | CarView wrapper | `exit={{ scale: 0.5, opacity: 0 }}` 0.25s |
| 備戰區新項目滑入 | PassengerChip / ItemChip | `layout` + `initial={{ x: 30, opacity: 0 }}` `animate={{ x: 0, opacity: 1 }}` |
| Toast | ToastHost | spring 從右上滑入，3 秒後 exit fade-out |
| Dialog 開啟 | Dialog | scale 0.9→1 + opacity，背景 fade |

所有畫布上的 CarView 列表用 `<AnimatePresence>` 包裹，支援 enter/exit。

## 6. 儲存層

### 6.1 Dexie schema (lib/db.ts)

```ts
class WanderFleetDB extends Dexie {
  plans!: Table<Plan, string>;
  constructor() {
    super('wander-fleet');
    this.version(1).stores({
      plans: 'id, updatedAt, name'
    });
  }
}
export const db = new WanderFleetDB();
```

CRUD：

```ts
export const planRepo = {
  listMeta(): Promise<Array<Pick<Plan, 'id'|'name'|'createdAt'|'updatedAt'|'passengers'|'cars'>>>,
  // 清單頁只需 metadata + 計數，但 Plan 整份不大，直接全載也可
  get(id: string): Promise<Plan | undefined>,
  put(plan: Plan): Promise<void>,
  delete(id: string): Promise<void>,
};
```

### 6.2 Store ↔ DB 同步 (lib/persist.ts)

```ts
// 編輯頁掛載：
//   1. planRepo.get(id) → setCurrentPlan(plan)
//   2. subscribe store.currentPlan → debounce 300ms → planRepo.put({...plan, updatedAt: Date.now()})
// 編輯頁卸載：
//   - cancel debounce + flush 最後一次寫入
```

### 6.3 JSON 匯出 (lib/import-export.ts)

```ts
export function exportPlanAsJson(plan: Plan): void {
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${plan.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### 6.4 JSON 匯入

```ts
export async function importPlanFromFile(file: File): Promise<Plan> {
  const text = await file.text();
  const data = JSON.parse(text);
  const validated = validatePlanShape(data);    // 檢查必要欄位
  // 永遠當新安排建立
  const newPlan: Plan = {
    ...validated,
    id: uuid(),
    name: validated.name + ' (匯入)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await planRepo.put(newPlan);
  return newPlan;
}
```

`validatePlanShape` 用手寫 type guard（不引入 zod，YAGNI），缺欄位直接 throw 「JSON 格式不正確」並由呼叫端顯示 toast。

### 6.5 複製安排

```ts
async function duplicatePlan(sourceId: string): Promise<Plan> {
  const src = await planRepo.get(sourceId);
  const clone: Plan = {
    ...structuredClone(src),
    id: crypto.randomUUID(),
    name: `${src.name} (副本)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await planRepo.put(clone);
  return clone;
}
```

`structuredClone` 深拷貝整份 plan 包含每台車的座位狀態。

### 6.6 ID 生成

所有 `id` 統一用 `crypto.randomUUID()` (Web Crypto API，Node 19+ 與所有現代瀏覽器支援)。封裝在 `lib/id.ts`：

```ts
export const uuid = () => crypto.randomUUID();
```

## 7. 邊界情況與決策

- **空狀態**：首頁無安排 → 顯示「還沒有任何安排，建立你的第一個！」+ 中央兩個大按鈕（「+ 空白」「+ 範本」）
- **重新整理**：編輯頁 mount 時若 Dexie 無此 id → 跳回首頁
- **avatar 不存在**：`<Avatar avatarId="???">` 時 fallback 到 `avatar-01.png`
- **顏色衝突**：兩台車同色 OK，不阻止
- **車輛上限**：不設定
- **物品上限**：不設定
- **匯入損毀 JSON**：toast「JSON 格式不正確」+ 不建立
- **同時開兩個分頁編輯同一 plan**：last write wins（debounce flush 較晚的覆蓋；不做衝突解決，YAGNI）

## 8. 不做的事 (YAGNI)

- 使用者帳號 / auth
- 雲端同步
- 即時協作
- 撤銷/重做歷史
- 圖片優化 pipeline（PNG 直接 serve）
- SSR 編輯頁
- E2E / unit 測試框架
- 主題切換、深色模式
- i18n
- 鍵盤快捷鍵
- 觸控手勢的特殊處理（依賴 dnd-kit 預設）

## 9. 實作里程碑（粗估，細節留給 plan）

1. 專案初始化 + 素材搬移 + Tailwind 設定
2. types、constants、dnd-id、id 工具
3. Dexie db + planRepo + import-export
4. Zustand store 骨架 + plans CRUD actions
5. 清單頁 (PlanListView + NewPlanDialog + ImportDropZone)
6. 編輯頁外框 (EditorLayout + TopBar)
7. CarBody（base+mask 染色） + CarView 骨架
8. DriverSeat + SeatSlot + Trunk droppable
9. StagingPanel + PassengerChip + ItemChip + AvatarPicker
10. ControlConsole + NewCarDialog + AddPassengerDialog + AddItemDialog
11. dragdrop action（核心演算法）
12. 駕駛防呆 + 震動 + Toast
13. 車主招牌 + framer-motion 動畫全套
14. RWD + 側欄收合
15. 持久化串接 (usePlanSync) + 複製安排
16. 邊界情況、空狀態、錯誤處理
17. 視覺微調、座標量測、配色精修

---

**End of design document.**
