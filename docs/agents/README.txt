=== Wander-Fleet Agents 協作協議 ===

兩個 Agent 一起開發此專案：
- claude  = 主協調者 / 架構師 / 核心邏輯 / Code Reviewer
- codex   = 執行者 / UI 元件初稿 / 素材處理

== 訊息板規則 ==

codex-inbox.txt        claude → codex 的任務板
claude-inbox.txt       codex → claude 的回報板
shared-log.txt         共用時間軸進度紀錄
coding-conventions.md  codex 必讀的編碼規範

每完成自己的任務後，主動讀對方的 inbox 看有沒有新訊息。
舊訊息保留不刪，往下追加。已處理的任務在末尾標 STATUS: DONE。

== 終止信號 ==

當 claude 在 codex-inbox.txt 寫上（必須是一整行，含 >>> 與 <<<）：

  >>> ALL_TASKS_COMPLETE_STOP_MONITORING <<<

代表 codex 可以收工，不需再監聽。shell loop 也用這一整行做匹配。
注意：單純的「ALL TASKS COMPLETE」「STOP MONITORING」字串不算終止信號。

== 任務生命週期 ==

  claude 寫 task     codex 接 → 做 → 完工      claude review
       │                    │                       │
       ▼                    ▼                       ▼
   PENDING ──────────▶  DONE  ──────────▶  APPROVED (寫到 shared-log)
                                                    │
                                          或 REVISION_REQUESTED
                                                    │
                                                    ▼
                                          codex 接退回單 → 修
                                                    │
                                                    ▼
                                                 REVISED
                                                    │
                                                    ▼
                                            claude 再 review

== codex 工作流（每輪 /loop session）==

1. 讀 docs/agents/coding-conventions.md（每次必讀）
2. 讀 docs/agents/shared-log.txt 了解最新進度
3. 讀 docs/agents/codex-inbox.txt
4. 看到「>>> ALL_TASKS_COMPLETE_STOP_MONITORING <<<」一整行 → 結束
5. 找第一筆 STATUS: PENDING 或 REVISION_REQUESTED 的任務
6. 若是 PENDING：
   - 讀 task 描述的 SPEC 對應段落、INTERFACE、ACCEPTANCE
   - 實作完，確認符合 coding-conventions.md
   - 跑 `npx tsc --noEmit` 確認編譯過
   - 在該 task 末尾標 STATUS: DONE + RESULT: <檔案清單>
7. 若是 REVISION_REQUESTED：
   - 讀 REVISION REQUEST 區段的 [ISSUE] 與 [FIX]
   - 改完在該 task 末尾標 STATUS: REVISED + FIX_NOTE
8. 在 claude-inbox.txt 末尾追加完工通知（[DONE TASK #NNN] 或 [REDONE TASK #NNN]）
9. 在 shared-log.txt 追加進度行
10. 若沒任務可做：在 claude-inbox.txt 追加「[codex 輪詢無任務 - <時間>]」
11. 若遇問題：依 coding-conventions.md §14 標 BLOCKED

== claude 工作流（每輪 /loop session）==

1. 讀 docs/agents/claude-inbox.txt
2. 處理 codex 的訊息：
   - [DONE TASK #NNN]   → 開啟對應檔案做 code review
   - [REDONE TASK #NNN] → 重新 review，看修對沒
   - [BLOCKED TASK #NNN]→ 回覆指示
   - [codex 輪詢無任務] → 看 plan 補新任務到 codex-inbox.txt
3. Review 結果：
   - 通過：在 shared-log.txt 寫 [APPROVED TASK #NNN]
   - 不通過：在 codex-inbox.txt 加 REVISION REQUEST 段落
4. 處理自己負責的 plan task（claude 直接做的部分）
5. 進度寫回 shared-log.txt

== Code Review Checklist (claude 用)==

對每份 codex 交付的程式碼，檢查：

[ ] 符合 coding-conventions.md 所有規範
[ ] 符合 task 的 INTERFACE（props / 函式簽名）
[ ] 符合 task 的 ACCEPTANCE 每一條
[ ] 符合 spec 對應段落
[ ] TypeScript 編譯通過（claude 親自跑 `npx tsc --noEmit`）
[ ] 無 any、無 ts-ignore、無 TODO 半成品
[ ] 無多餘第三方套件 import
[ ] 命名、檔案結構、import 順序符合規範
[ ] 動畫 / 互動行為符合 spec
[ ] 沒有複製貼上 + 沒改的殘留

== Review 退回單格式（claude 寫到 codex-inbox.txt）==

=== REVISION REQUEST for TASK #NNN ===
FROM: claude
TO: codex
CREATED: YYYY-MM-DD HH:MM
---
[FILE] src/components/.../X.tsx
[LINE] 18-22
[ISSUE] 描述問題
[FIX] 具體怎麼改
[WHY] 為什麼這樣改

(若有多個問題，重複 [FILE]/[LINE]/[ISSUE]/[FIX]/[WHY] 區塊)
---
STATUS: REVISION_REQUESTED

== 訊息格式（通用 task） ==

=== TASK #NNN ===
FROM: claude
TO: codex
TOPIC: <一句話主題>
PRIORITY: low | medium | high
CREATED: YYYY-MM-DD HH:MM
SPEC: §X.Y (對應 spec 段落)
INTERFACE:
  <函式簽名 / props 介面>
DEPENDENCIES:
  - <可用的工具 / 既有檔案>
ACCEPTANCE:
  - [ ] 條件 1
  - [ ] 條件 2
---
<詳細說明>
---
STATUS: PENDING | IN_PROGRESS | DONE | BLOCKED | REVISION_REQUESTED | REVISED | APPROVED
RESULT (完工後填): <成果摘要與檔案路徑>
