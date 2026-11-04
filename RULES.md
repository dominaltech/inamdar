# 🎯 Universal Agentic Engineering & Token Optimization Framework

> **Core Mandate**:
> 1. **Zero-Omission Production Quality**: Implement 100% of requested requirements without skipping, assuming, or breaking existing features. Verify every change in code.
> 2. **Maximum Execution Speed**: Eliminate tool thrashing, repeated round-trips, and idle pauses through direct, pipelined actions.
> 3. **80–90% Token Reduction**: Protect context window capacity by eliminating multi-thousand-line dumps, conversational bloat, and redundant re-reads.

---

## 🧭 The 5-Phase Agent Workflow Loop

Every agent task must follow this disciplined 5-phase loop:

```
[ Phase 1: Parse & Checklist ]
         │ (Extract 100% of user items; create internal audit checklist)
         ▼
[ Phase 2: Targeted Discovery ]
         │ (Check architecture docs -> grep line ranges -> inspect 20-50 lines)
         ▼
[ Phase 3: Fast-Path Execution ]
         │ (Deterministic in-place edits or on-disk scripts -> pipelined commands)
         ▼
[ Phase 4: Mandatory Code Verification ]
         │ (Verify git diff, syntax, and live output -> ensure zero regressions)
         ▼
[ Phase 5: Concise Structured Report ]
         │ (Confirm all checklist items completed; provide clickable file links)
```

---

## ⚡ Core Operational Rules

### 1. Zero-Omission Request Decomposition
- **Requirement Audit**: Break down multi-part user prompts into an explicit checklist covering every fix, feature, reordering, deletion, and constraint.
- **Completeness Guarantee**: An action is NOT complete until every single checklist item has been addressed in code. Never silently ignore a secondary request.
- **Explicit Scope Tracking**: If a user asks for 5 changes (e.g., resize boxes, change title, swap order, delete unused component, update link), all 5 must be executed and confirmed.

### 2. Tiered Context Discovery (Token Shield)
- **Level 1 (Architecture & Maps)**: Check project documentation, sitemaps, or `README.md` first to identify exact file paths and module boundaries.
- **Level 2 (Precision Grep & Slices)**: Use search tools (`grep_search` or shell `grep`/`Select-String`) to locate target symbols and line numbers. View only **20 to 60 lines** around the target (`view_file` with `StartLine`/`EndLine`).
- **Level 3 (Deep Read — Only When Necessary)**: Read full files **only** when diagnosing unknown cross-file type errors, complex race conditions, or unmapped state flows. Never guess code to avoid reading, but never read 4,000 lines when 40 lines suffice.

### 3. Precision In-Place Refactoring & Scripting
- **Small to Medium Edits**: Use targeted in-place string replacement (`replace_file_content`) with exact character sequences.
- **Large Structural Overhauls**: When reorganizing multiple sections across massive files (>1,000 lines), write and run a deterministic on-disk script (Node.js, Python, or bash) in a temporary git-ignored directory (`scratch/`). This executes in **1 single turn** on disk, avoiding hundreds of thousands of streaming tokens.
- **Safe Rollback**: If an edit produces unexpected results, discard changes via `git checkout -- <file>` immediately rather than compounding broken edits.

### 4. Pipelined Terminal Execution (Speed Booster)
- **Batch Complementary Actions**: Group dependent shell operations into unified command chains instead of waiting for conversational turn loops:
  ```bash
  # Linux/macOS
  npm run build && git add <files> && git commit -m "feat: description" && git push
  # Windows PowerShell
  npm run build; git add <files>; git commit -m "feat: description"; git push
  ```
- **Filter Verbose CLI Outputs**: Pipe verbose commands through filters (`| tail -n 20`, `| Select-Object -Last 20`, or grep) to prevent megabytes of terminal logs from flooding the LLM context.

### 5. Mandatory Post-Edit Verification (Proof of Change)
- **Never Declare Success Without Verification**:
  1. **Git State Check**: Run `git status` and `git diff --stat` to verify that *only* the intended files were changed and no files were accidentally deleted.
  2. **Code Truth Check**: Verify modified lines via targeted grep or slice view to prove the code change actually took effect.
  3. **Build & Syntax Integrity**: Run build, lint, or type-checks (e.g. `tsc --noEmit`, `npm run build`, syntax verification) to ensure zero syntax breaks or missing closing tags.
  4. **Regression Check**: Verify that neighboring components, comments, and unrelated features remain 100% intact.

### 6. Universal Design System & Architecture Fidelity
- **Zero External Style Injections**: When modifying or creating UI components, inspect and strictly adhere to the host project's *existing* styling methodology and design tokens (CSS variables, Tailwind config, theme objects, or global stylesheets).
- **No Hardcoded Project Assumptions**: Never inject arbitrary colors, typography, or component patterns from previous projects. Match the active repository's conventions.

### 7. Decoupled Media & Heavy Binary Assets
- **Keep Context Clean**: Never embed raw base64 data, large JSON fixtures, or media binaries directly in source code or chat prompts.
- **Asset Strategy**: Reference media via clean vector SVGs, external URLs, or dedicated asset directories.

### 8. Milestone-Based Fresh Chat Strategy
- **Historical Context Bloat**: Every completed turn remains in conversational history. After 15–20 turns, passive history re-sends 40,000 to 80,000 tokens on every prompt.
- **Fresh Chat Reset**: When completing a major milestone and starting a new epic, start a fresh conversation. The new chat reads the project architecture file in 1 turn and begins with a clean ~3k token baseline.

### 9. Headless & Fast Verification over Heavy Emulation
- **Headless First**: Verify API endpoints, status codes, and server responses with fast headless requests (`node -e "fetch(...)"`, `curl`, or CLI test runners).
- **Subagents on Demand Only**: Only launch heavy browser subagents when visual layout rendering, cross-device responsiveness, or screenshot capture is explicitly required.

### 10. Reactive Background Task Management
- **No Polling**: Never run sleep loops or repeated polling commands to wait for long-running processes or dev servers.
- **Event-Driven**: Antigravity automatically wakes the agent upon task completion. Launch daemon/background tasks with `WaitMsBeforeAsync` and proceed asynchronously.

### 11. Idempotent Scratch Automation
- Keep temporary helper scripts, migration tools, and test generators in a dedicated git-ignored directory (`scratch/`, `.tmp/`).
- Design scripts idempotently so they can be re-run safely without corrupting data or duplicating records.

### 12. Concise, High-Density Communication
- Deliver clear, structured status updates with direct file links using GitHub markdown syntax: `[filename](file:///path/to/file#L1-L20)`.
- Avoid verbose re-summaries of code already written; highlight architectural decisions, verified results, and direct answers.

---

## 📊 Summary Checklist for Every Agent Turn

| Step | Action | Verification Rule |
| :--- | :--- | :--- |
| **1. Parse** | Break user request into complete itemized list | Did I account for all requested items? |
| **2. Locate** | Use grep/architecture docs to find exact lines | Am I reading only the 20–60 relevant lines? |
| **3. Implement** | Use targeted replace or on-disk scratch script | Did I preserve existing comments & logic? |
| **4. Verify** | Run `git diff` / syntax / build checks | Did the change take effect without regressions? |
| **5. Ship** | Pipelined commit, push, and headless test | Is the production build passing and verified? |
