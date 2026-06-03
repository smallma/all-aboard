# Wander-Fleet 編碼規範（給 codex 必讀）

> **重要**：每次接到任務，**先讀本檔 + 對應 spec 段落**，再開工。
> 違反規範的程式碼會被 claude 退回 REVISION REQUEST。

---

## 0. 開工前必做（每個 task 都要）

1. 讀 `docs/superpowers/specs/2026-05-26-wander-fleet-design.md` 對應段落（task 描述會註明）
2. 讀本檔的對應規範段落
3. 看 task 描述的 INTERFACE 與 ACCEPTANCE 區段，逐項對照
4. 若有不確定的地方：**不要瞎猜**，寫到 `claude-inbox.txt` 標 `STATUS: BLOCKED` 問 claude

---

## 1. 檔案結構

- 一個 React 元件 = 一個檔案，檔名與元件名一致（`PassengerChip.tsx` 內 export `PassengerChip`）
- 用 **named export**，**不要 default export**
  ```ts
  // ✅ 對
  export function PassengerChip(props: Props) { ... }
  // ❌ 錯
  export default function PassengerChip(...) { ... }
  ```
- **例外**：Next.js App Router 規定 `src/app/**/page.tsx`、`layout.tsx`、`loading.tsx`、
  `error.tsx`、`not-found.tsx`、`route.ts` 必須 default export — 這些檔可以也只能 default export。
- 元件 props 型別：在同檔案宣告 `type Props = { ... }`，**不 export Props 型別**（除非父元件真的要用）
- 一個元件超過 200 行就要拆，子元件放同目錄

---

## 2. 命名

| 種類 | 規則 | 範例 |
|---|---|---|
| 元件 | PascalCase | `PassengerChip` |
| Hook | camelCase + `use` 前綴 | `usePlanSync` |
| Type / Interface | PascalCase | `Passenger`, `CarType` |
| Constants | SCREAMING_SNAKE_CASE | `CAR_SPECS`, `COLOR_HEX` |
| 一般函式 / 變數 | camelCase | `handleDragEnd` |
| 檔名（元件） | PascalCase.tsx | `PassengerChip.tsx` |
| 檔名（非元件） | kebab-case.ts | `dnd-id.ts` |

---

## 3. TypeScript

- **嚴禁 `any`**。需要 narrow 用 `unknown` + type guard
- **嚴禁 `@ts-ignore` / `@ts-expect-error`**（除非註解寫明確原因且 claude 同意）
- 型別從 `lib/types.ts` import，**不要在元件檔內重複定義 domain 型別**
- 函式參數與回傳值都標型別（哪怕 TS 能推斷）：
  ```ts
  // ✅ 對
  function getCarTitle(car: Car, plan: Plan): string { ... }
  // ❌ 錯
  function getCarTitle(car, plan) { ... }
  ```
- React 元件用 `function Component(props: Props)` 寫法，不要 `React.FC`

---

## 4. React

- **僅用函式元件**，無 class
- 用 **named export**
- Props 用 destructuring：
  ```tsx
  // ✅ 對
  export function Chip({ name, onRemove }: Props) { ... }
  // ❌ 錯
  export function Chip(props: Props) { return <div>{props.name}</div> }
  ```
- 副作用：`useEffect` 內含 cleanup，dependency array 嚴格列全
- 不要在 render 內 `new Date()` / `Math.random()` / `crypto.randomUUID()`，會破壞 hydration
- 元件不直接調 `db.ts` / `dexie`，**只透過 store actions**

---

## 5. Tailwind / 樣式

- 用 Tailwind utility class，**少寫自訂 CSS**
- 條件 className 用 `clsx`：
  ```tsx
  import { clsx } from 'clsx';
  <div className={clsx('rounded-xl p-2', active && 'bg-blue-500', disabled && 'opacity-50')} />
  ```
- 不寫 inline `style={{}}` **除非值是動態算出來的**（如 CAR_SPECS 的座標、COLOR_HEX 的顏色）
- 顏色用 Tailwind palette（gray-700、blue-500...），不寫 hex 在 className 裡
- 不引入新的 CSS 框架（沒有 styled-components、emotion）

---

## 6. 圖示

- 所有圖示用 `lucide-react`：
  ```tsx
  import { Package, X, Car } from 'lucide-react';
  <Package className="w-4 h-4" />
  ```
- 若 lucide 沒有需要的圖示，用 emoji（不要 import 其他 icon lib）
- 不要自己畫 SVG（除非 claude 同意）

---

## 7. dnd-kit

- droppable / draggable ID 一律透過 `lib/dnd-id.ts` 的 `buildDndId()`，**不要寫 raw 字串**
  ```ts
  // ✅ 對
  const id = buildDndId({ kind: 'seat', carId, seatIndex: 0 });
  // ❌ 錯
  const id = `car:${carId}:seat:0`;
  ```
- 元件只 register droppable/draggable + 把 event 送到 store，**不在元件內做業務邏輯**

---

## 8. 動畫 (framer-motion)

- `motion.div` 配 `initial` / `animate` / `exit` / `transition`
- 用 spring transition：`{ type: 'spring', stiffness: 260, damping: 18 }`
- `AnimatePresence` 包列表，要設 `key`
- 不要自己寫 `requestAnimationFrame` 動畫

---

## 9. 套件管理

- **不要新增第三方套件**。`package.json` 已固定如下：
  ```
  next, react, react-dom,
  @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities,
  framer-motion, lucide-react, zustand, dexie, clsx
  ```
- 若你覺得需要新套件：寫到 `claude-inbox.txt` 標 `STATUS: BLOCKED`，等 claude 同意
- 不要用 `eval`、`Function()` 之類

---

## 10. 註解

- **盡量不寫註解**。命名好 + 程式碼好讀就不需要
- 只在「非顯而易見的 WHY」寫一行註解：
  ```ts
  // 拖曳期間不寫 Dexie，避免每幀 IO；改 debounce
  useDebouncedEffect(() => planRepo.put(currentPlan), [currentPlan], 300);
  ```
- 不寫 `// TODO` 留半成品；要嘛做完，要嘛標 BLOCKED 問 claude
- 不寫 JSDoc / 多行註解區塊
- 不寫「修改紀錄」「Created by」這種

---

## 11. Import 順序

```ts
// 1. React / Next
import { useState } from 'react';

// 2. 第三方
import { useDroppable } from '@dnd-kit/core';
import { Package } from 'lucide-react';
import { clsx } from 'clsx';

// 3. 專案內（@/lib, @/store, @/components, @/hooks）
import type { Passenger } from '@/lib/types';
import { buildDndId } from '@/lib/dnd-id';
import { usePlanStore } from '@/store/usePlanStore';

// 4. 相對路徑
import { Avatar } from '../shared/Avatar';
```

---

## 12. 完成定義 (Definition of Done)

一個 task 完成的條件：

1. ✅ 程式碼寫完，符合上面所有規範
2. ✅ TypeScript 編譯通過（執行 `npx tsc --noEmit`）
3. ✅ 在 task 對應的 ACCEPTANCE criteria 每一條都符合
4. ✅ 在 task 末尾標 `STATUS: DONE` + `RESULT:` 列出寫了哪些檔案
5. ✅ 在 `claude-inbox.txt` 末尾追加：
   ```
   [DONE TASK #NNN] 已完成「X 任務」，產出：
     - src/components/.../A.tsx (新建)
     - src/components/.../B.tsx (新建)
   請 claude review。
   ```
6. ✅ 在 `shared-log.txt` 追加進度行：
   ```
   [YYYY-MM-DD HH:MM] [codex] TASK #NNN 完成
   ```

---

## 13. 被 REVISION REQUEST 退回時

1. 仔細讀 `codex-inbox.txt` 裡的 `REVISION REQUEST` 段落
2. 依照 `[FIX]` 指示修改
3. 修完在同任務末尾追加：
   ```
   STATUS: REVISED
   FIX_NOTE: 已修 X 行 Y 處
   ```
4. 在 `claude-inbox.txt` 追加：
   ```
   [REDONE TASK #NNN] 已依 review 修正，請再次 review。
   ```

---

## 14. 遇到問題（BLOCKED）

不要瞎猜。寫到 `claude-inbox.txt`：

```
[BLOCKED TASK #NNN]
問題：spec §X.Y 沒提到 hover 顏色，但 ACCEPTANCE 說「hover 變色」。
我的選項：
  A. 用 hover:bg-gray-100
  B. 用 hover:ring-2 hover:ring-blue-400
請 claude 指示用哪個。
```

然後**停下這個任務**，去做 inbox 裡下一個 PENDING 任務（不要枯等）。

---

## 15. 哲學總結

- **不確定就停下來問**，不要瞎猜
- **規範優先於個人偏好**：不要因為你「覺得這樣比較好」就違反規範
- **可讀性 > 簡潔性**：寧可多一個變數讓人讀懂，也不要硬塞一行
- **不過度設計**：別添加 spec 沒要求的功能、別預想未來需求
- **完工 > 完美**：能跑、符合 ACCEPTANCE 就是完工。雕花留給 claude 整合時做
