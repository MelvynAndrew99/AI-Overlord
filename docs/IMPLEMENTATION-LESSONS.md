# Shared implementation lessons

This is the shared engineering record for Codex, Claude Code and Grok Build. Read AGENTS.md for user intent and approval boundaries, docs/DESIGN.md for gameplay direction, and CLAUDE.md for the inherited RUN architecture. This file records implementation evidence, not a competing design vision.

## How specialists use this record

Before work: read the relevant entries and source code. Follow accepted patterns. If a pattern appears unsuitable, explain the concrete tradeoff to the lead rather than silently introducing an alternative architecture.

After work: propose a concise lesson with context/problem, decision, evidence/checks, scope, and remaining uncertainty. Mark it proposed until verified. The lead integrates accepted lessons, removes duplication, and marks superseded entries. Delegates should return proposed notes in their handoff rather than simultaneously edit this shared file unless explicitly assigned ownership.

Record only reusable findings. Avoid transcripts, speculation presented as fact, credentials, and one-off command noise. Failed approaches are useful when the reason for failure is captured. User preferences belong in AGENTS.md; gameplay decisions belong in DESIGN.md. Reference those rather than duplicating them.

## Verified patterns

### Environment and builds

- Use Ubuntu/WSL with the repository's Nix flake. Run npm and rundot inside nix develop; avoid mixing Windows npm with WSL-installed dependencies.
- npm run dev includes the host setting needed for the current preview workflow. npm run build runs TypeScript checking then Vite. npm run deploy builds before uploading.
- The pinned RUN CLI needs native dependencies including ICU. The Nix derivation supplies them; no invariant-globalization workaround is required inside the shell.
- Verification: shell tool versions, flake evaluation, production build and local HTTP responses passed during setup. HTTP success alone does not verify visual gameplay or mobile behavior.

### RUN platform integration

- Preserve september-jam-barebones kit metadata in game.config.prod.json and rundot/kit.json. Existing game ID: l7mD5BHH8LslWkr5mC7d. Do not register a new game for each iteration.
- Routine uploads remain private. Public publication is a separate decision.
- CLI auto-enabled text generation on first deployment. rundot/textGen.config.json now explicitly disables it. The prototype does not need real runtime model calls for context mutations.
- Uploading a server configuration alone did not change the active private version's config ID. Deploying then verifying game info confirmed the active config. Verify active state, not just successful config upload.
- Consult installed CLI help: public documentation can describe older command names or config layouts.

### Game architecture inherited from the official starter

- React owns screens/HUD, Pixi owns simulation/rendering, and the shared store carries discrete events rather than per-frame React updates.
- Keep SDK boot and lifecycle ordering. Scenes own their ticker callbacks/display objects and clean them up on exit.
- Use the design-unit stage and resize hooks instead of hard-coded physical pixel positions.
- SDK failures must not prevent plain-browser play. Follow the existing save and lifecycle patterns; see CLAUDE.md for details.
- Traffic mechanics and token balance are not implemented or validated yet. Do not promote proposed mechanics to engineering facts.

### Cross-model art workflow

- Grok Build's Imagine tools generated actual image assets inside its session image directory. In this environment, headless sessions repeatedly ended before their Execute-based copy/export step produced project files. Ask Grok to return the exact generated path and let the lead handle export and verification. This is an observed environment limitation, not a general claim about Grok.
- Inspect the actual generated image: Grok's verbal quality assessment did not always catch incorrect action direction or a villainous expression.
- Retain masters outside public and export production thumbnail as 512x512 JPG. Inspect small-size readability. User approval of art remains necessary; a successful generation is not adoption.
- Pass text-only briefs when source-image sharing has not been explicitly authorized. Do not silently send user reference files to external tools.

## Lesson handoff template

- Task / owner:
- Problem or observation:
- Proposed reusable pattern:
- Evidence and validation:
- Limits or uncertainty:
- Existing entry superseded (if any):
- Status: proposed / verified / superseded

## v0.1 integration lessons (2026-09-05)

- Verified by model tests: resolve rotated controls at the input boundary once; collision simulation accepts resolved lanes and knows nothing about keyboard labels.
- Verified by integration review: agree shared board geometry and vehicle footprints before parallel implementation. Renderer bodies now match model dimensions (26x44, trucks26x68); decorative shadows are not collision promises.
- Verified by code review: reset renderer identities when restarting a fresh simulation; reused IDs must not retain old vehicle art.
- Verified by story integration: narrative copy must not report unmeasured outcomes. Claude's draft required editing before adoption.
- Proposed, not audio-tested: keep music's shared palette and motif while escalating rhythmic density rather than volume. Preserve space for gameplay cues and evaluate retry fatigue.
- Proposed, not playtest-proven: recoverable mistakes and short shifts may encourage mastery. Unit tests prove rules, not enjoyment. Household observations should drive the next balance pass.