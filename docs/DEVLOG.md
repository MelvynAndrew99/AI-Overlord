# Development log

## 2026-09-05: official starter and Nix environment

### Decisions

- Traffic cop is the first mechanics testbed; expanded Lemmings-inspired AI roles come later.
- Token balance remains a playtest question. Surplus may make deliberate havoc affordable without an explicit autonomy unlock.
- Use the official September Jam Bare Bones kit, preserving both kit metadata files.
- Use Ubuntu/WSL and a Nix flake, as requested. No global Node/npm installation or nix-env changes.

### Completed

- Scaffolded the official september-jam-barebones kit through RUN CLI.
- Preserved upstream architecture instructions and saved its README as RUN-TEMPLATE.md.
- Added flake.nix and flake.lock. Node 24.19.0, npm 11.17.0, RUN CLI 7.14.3 verified in the shell.
- Packaged the official RUN CLI with a pinned SHA-256 and Nix native dependencies, including ICU. No invariant-globalization workaround needed inside the flake.
- Marked only the flake files intent-to-add so nix develop can discover them; no commit made.
- Installed dependencies from the starter lockfile, then applied compatible updates to @xmldom/xmldom, nanoid, and postcss. npm reports zero known vulnerabilities.
- RUN browser login completed successfully. Credentials remain in the CLI's user configuration, outside the repository.
- Saved DESIGN.md with the agreed direction and open questions.

### Verification

- nix flake check --no-build: passed evaluation.
- nix develop: built and entered successfully; CLI and Node version checks passed.
- npm run build: TypeScript and production bundle passed after dependency updates.
- Vite development server started on port 5173.
- HTTP 200 confirmed from both Ubuntu and Windows at http://localhost:5173/.
- Browser automation could not initialize because of a tool sandbox startup error. Visual gameplay, menu round-trips, persistence, and mobile sizing still need manual verification.
- The upstream Pixi bundle produces Vite's non-fatal 500 KB chunk advisory.

### Next

1. Open the preview, press Play, return to Menu, and reload to test the upstream save behavior.
2. Replace the demo with an ordinary traffic intersection before introducing corruption.
3. Test one announced mutation and provisional token/reset behavior.
4. Replace thumbnail art, register Context Collapse, and deploy privately when the first playable build is ready.

No RUN game registration or deployment has been performed. The current preview is the upstream demo, not traffic gameplay.

### Recording notes

Show the concept, nix develop, a successful build, and the starter running. Explain the roles: Nix supplies the development tools; npm supplies project libraries; Vite runs/builds the game; rundot connects it to RUN. Capture what needed human judgment: selecting the eligible kit, preserving the design intent, and choosing the first test. Avoid recording login credentials.

## First private upload
Accepted city cover adopted at public/thumbnail.jpg. Game title and save namespace updated to AI Overlord; menu explicitly labels the starter demo. TypeScript/production build passed. Registered RUN game l7mD5BHH8LslWkr5mC7d with jam kit preserved. Private version 1.0.1 deployed; live text generation disabled explicitly after CLI auto-enabled it. Next: replace demo scene with traffic loop and iterate locally, then npm run deploy. Hosted visual playtest remains user-checkable; CLI deployment success is verified.

## Coordination agreement
User designated the lead as intent keeper and coordinator of independently critical specialists across Codex, Grok Build, and Claude Code. Delegate based on demonstrated task fit, maintain likes/dislikes and rationale, own implementation/integration/testing, and reserve user attention for people-facing and consequential creative decisions. See AGENTS.md for the durable agreement.
