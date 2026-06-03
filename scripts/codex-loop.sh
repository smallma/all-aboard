#!/bin/bash
# Wander-Fleet codex unattended loop
# Usage: ./scripts/codex-loop.sh
# Stop: write [ALL TASKS COMPLETE - STOP MONITORING] to codex-inbox.txt
#       or touch docs/agents/.stop
#       or Ctrl+C

set -u

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Load nvm and switch to .nvmrc version (codex needs node 22.12.0)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  if [ -f .nvmrc ]; then
    nvm use >/dev/null 2>&1 || nvm use "$(cat .nvmrc)" >/dev/null 2>&1 || true
  fi
fi
echo "[init] node: $(node --version 2>&1)  codex: $(command -v codex || echo 'NOT FOUND')"

INBOX="docs/agents/codex-inbox.txt"
OUTBOX="docs/agents/claude-inbox.txt"
STOP_FLAG="docs/agents/.stop"
SLEEP_SECONDS=60

PROMPT='你是 Wander-Fleet 專案的執行副手。本輪你只做「一個」任務然後退出。

【步驟】
1. 讀 docs/agents/coding-conventions.md（每輪必讀，不可跳過）
2. 讀 docs/agents/codex-inbox.txt
   - 若檔案末尾含一整行「>>> ALL_TASKS_COMPLETE_STOP_MONITORING <<<」 → touch docs/agents/.stop 然後退出
   - 找到「== 目前待辦任務 ==」這一行
   - 在這行「之後」找第一個 ===TASK #NNN=== 區塊，其 STATUS 標記是 PENDING（注意：歸檔區的舊任務不算）
3. 若沒找到任何 PENDING task：
   - 在 docs/agents/claude-inbox.txt 末尾追加一行：「[codex 無待辦 - <當前時間>]」
   - 退出本輪
4. 若找到 PENDING task：
   - 讀該 task 的 INTERFACE / DEPENDENCIES / ACCEPTANCE / 內文規格
   - 嚴格遵守 coding-conventions.md 與該 task 的 ACCEPTANCE 條件實作
   - 完成後跑 `npx tsc --noEmit` 驗證編譯
   - 編譯通過：
     a) 在該 task 末尾追加：
        STATUS: DONE
        RESULT: <列出新建/修改的檔案路徑與簡述>
     b) 在 docs/agents/claude-inbox.txt 末尾追加：
        [DONE TASK #NNN] 已完成「<topic>」，產出：
          - <檔案 1>
          - <檔案 2>
        請 claude review。
     c) 在 docs/agents/shared-log.txt 末尾追加一行進度
   - 編譯失敗：
     a) 修到通過為止（不要寫 // TODO 留半成品）
     b) 若仍卡住：在 task 末尾追加 STATUS: BLOCKED，並在 claude-inbox.txt 追加 [BLOCKED TASK #NNN] + 問題描述
5. 完成「一個」任務後立刻退出，不要嘗試做下一個（外部 shell loop 60s 後會再喚醒你）。

【絕對禁止】
- 不要刪除或覆蓋 codex-inbox.txt 既有區塊（歸檔區不可動、其他任務不可動）
- 不要在本輪做超過一個 task
- 不要把 STATUS: PENDING 改成 IN_PROGRESS 後不完工就退出（要嘛 DONE、要嘛 BLOCKED）'

echo "============================================"
echo " Wander-Fleet codex loop start"
echo " Project root: $PROJECT_ROOT"
echo " Poll interval: ${SLEEP_SECONDS}s"
echo " Stop: touch $STOP_FLAG  or  Ctrl+C"
echo "============================================"

# Ensure inbox files exist
mkdir -p docs/agents
[ -f "$INBOX" ] || echo "=== codex inbox ===" > "$INBOX"
[ -f "$OUTBOX" ] || echo "=== claude inbox ===" > "$OUTBOX"

iteration=0

trap 'echo "Got Ctrl+C, exit loop"; exit 0' INT

while true; do
  iteration=$((iteration + 1))

  # Stop signal: file flag
  if [ -f "$STOP_FLAG" ]; then
    echo "[$(date +'%H:%M:%S')] detected $STOP_FLAG, exit loop"
    rm -f "$STOP_FLAG"
    exit 0
  fi

  # Stop signal: dedicated termination line in inbox
  if grep -qE "^>>> ALL_TASKS_COMPLETE_STOP_MONITORING <<<$" "$INBOX" 2>/dev/null; then
    echo "[$(date +'%H:%M:%S')] detected termination flag in inbox, exit loop"
    exit 0
  fi

  echo ""
  echo "[$(date +'%H:%M:%S')] === Iteration $iteration start ==="

  # Run codex (OpenAI Codex CLI 0.133.0)
  # -a never           : never ask for approval
  # -s workspace-write : allow writing in workspace
  # --skip-git-repo-check : allow non-git workdir
  if command -v codex >/dev/null 2>&1; then
    codex -a never -s workspace-write exec --skip-git-repo-check "$PROMPT" \
      || echo "[$(date +'%H:%M:%S')] codex iteration failed (token limit / network?), retry in $SLEEP_SECONDS s"
  else
    echo "codex CLI not found"
    echo "Install: npm install -g @openai/codex@latest"
    echo "Or:      nvm use 22.12.0"
    exit 1
  fi

  echo "[$(date +'%H:%M:%S')] === Iteration $iteration end, sleeping ${SLEEP_SECONDS}s ==="
  sleep "$SLEEP_SECONDS"
done
