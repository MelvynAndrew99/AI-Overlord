# Project instructions: AI Overlord / Context Collapse

Read docs/DESIGN.md for the game concept and CLAUDE.md for the RUN starter architecture.

## User preferences and decisions

- Father-and-son Back to Work jam project, also documented as a YouTube series about building with AI.
- Start with traffic cop mechanics. Explore Lemmings-inspired additional AI roles only after the core works.
- The player IS the AI. Do not introduce a separate human-helper mechanic as the default solution.
- Chaos must be funny, understandable and learnable. Mastery produces token surplus; surplus may make deliberate havoc affordable. Token balance is unresolved until the MVP, not a finalized moral alignment or autonomy-unlock system.
- Use Nix flakes for the WSL environment. Run npm and rundot inside nix develop. npm run dev starts the game.

## Visual direction (explicit user feedback, 2026-09-05)

- User rejected the glossy generated robot thumbnails, including thumbnail-v2-thumbs-up and thumbnail-v3-all-green. Do not treat those as approved art or as style references to imitate.
- User wants inspiration from SNES, PS1 and N64-era layouts and feel: readable action, playful personality, strong perspective, memorable staging, and authored game-like composition. This does NOT require matching period graphics. Modern rendering is welcome when it supports that feel; pixel art, low-poly geometry, limited palettes, jagged edges, and hardware artifacts are optional, not requirements.
- Avoid generic glossy 3D toy mascots, polished AI screenshot aesthetics, cinematic bloom, floating tutorial cards and cluttered typography.
- Work with installed Grok Build for the next visual candidates, as explicitly requested. Be honest about which tool made the artwork; do not silently substitute another image generator.
- These console eras are direction references, not permission to copy existing characters, logos or game assets.
- Keep real AI-company logos out of candidate art unless the user revisits that decision and usage is checked.
- Confirmed game title: AI Overlord. Context Collapse is an earlier working name.

## Artwork approval

- New artwork remains a candidate until the user explicitly likes/selects it.
- Agent review is not user approval. Do not replace public/thumbnail.jpg, publish art, or call a candidate final based only on agent preference.
- Save alternatives separately and preserve originals. Show the actual output and invite focused feedback before adoption.
- RUN production thumbnail export is 512x512 JPG; preserve editable/high-resolution source separately.

- Latest thumbnail feedback: previous Grok scenes felt too serious. Prioritize a single immediately readable comic misunderstanding and the emotional hook 'AI cannot take our jobs... can it?' Keep the composition sparse; disaster alone is not a visual joke. Use Grok for the next thumbnail candidate.

- Latest humor direction: calm/confident or ambiguously knowing AI in the foreground, clear cartoon catastrophe behind it. This supersedes the complicated STOP-paddle gag. Borrow comedic contrast rather than exact meme characters; keep scene sparse. Use text-only descriptions for Grok unless the user explicitly authorizes sharing source images. User approval is still required before adopting art.

- User emphasizes familiar meme staging for small-form-factor readability. Evaluate the calm face versus obvious disaster at 128px; recognition should come from the contrast, not tiny text or exact copied characters.

- Latest cover direction: low-angle dominant original robot with ruined city behind and prominent AI OVERLORD title, borrowing box-art hierarchy from the supplied Fallout New Vegas example, not its character, armor, weapon or branding. Shelf appeal is the goal. Cars are optional, not mandatory. Preserve workplace comedy and avoid accidentally promising a shooter.
- Core expression: quiet superiority with ambiguous intent. Before mastery it can mean overconfidence; after play it can mean deliberate domination. No tagline that labels it an accident (e.g. 'MY BAD'), panic, or unambiguously evil grin. The existing calm-chaos picture captures the joke but is not approved finished cover art.

- User clarified city cover represents future jobs, not only traffic. Next cover should not be forced into traffic props, cars or uniforms. Use low-angle AI authority, ambiguous smugness, broad city catastrophe and AI OVERLORD title. Borrow presentation hierarchy only, no Fallout theme or weapons. Household testing candidate requested; not production approval.

- Cover expression must initially suggest unearned confidence, not obvious malice. Only after playing should responsibility or deliberate intent become a possible reinterpretation. Latest city-cover-candidate is for household testing, not approved art.

- User accepted city-cover-candidate as the current cover (style may evolve). It is now adopted at public/thumbnail.jpg. User requested starting uploads/iteration; initial upload is private starter prototype, not public jam release.

## Working agreement: lead agent represents the user

User explicitly authorizes delegation to Codex subagents, installed Grok Build, and Claude Code according to demonstrated task performance. The lead owns coordination, integration, verification, and faithful representation of user intent; do not make the user manage specialist execution.

- Maintain durable notes about accepted decisions, rejected approaches and WHY, unresolved hypotheses, and explicit approval boundaries. Read these notes before briefing new specialists. New user corrections supersede earlier interpretations.
- Distinguish explicit user preferences from lead inferences. Do not claim to know unstated preferences. Clarify only consequential uncertainty; handle routine implementation autonomously.
- Brief experts with goals, relevant evidence, constraints, and acceptance criteria, but avoid leading them toward the lead's preferred answer. Ask for disagreement, alternatives, and failure modes. Independent expertise does not mean ignoring user constraints, and no model is guaranteed unbiased.
- Keep the user's intent distinct from specialist advice. Synthesize disagreements and exercise judgment; do not use majority vote as a substitute for reasoning.
- Route by observed quality rather than brand reputation. Grok Imagine produced the currently accepted cover after iteration, making Grok a useful visual collaborator. Claude provided a useful independent cover critique. Codex has handled implementation, Nix/RUN setup, integration, and verification. These are observations from this project, not universal rankings.
- Give delegated tasks concrete scope, permitted file areas, and expected deliverables. Avoid overlapping writes and unnecessary agents. Honor restrictions on sending source files externally; text-only briefs are sufficient unless sharing is explicitly authorized.
- Complete authorized work and verify outputs before reporting success. Progress updates should emphasize results, decisions and blockers, not ask the user to manage mechanics of delegation.
- User wants to focus on people-facing systems, player feedback and creative direction rather than implementation. Bring back playable/visible work and concise consequential tradeoffs.
- Artwork adoption still needs user selection. Current city cover is accepted for now; future replacements need review. Private build iteration is authorized; public publication remains separate.
- Do not imply awareness of the zpet project's details without inspecting user-provided context. This working agreement applies here and does not imply automatic memory across unrelated projects.

## Specialist learning and shared patterns
All specialists must read docs/IMPLEMENTATION-LESSONS.md before relevant work and include proposed reusable lessons in their handoff afterward. The lead verifies and merges notes into that shared record, avoiding concurrent writes and competing copies of the vision. Separate proposed hypotheses from verified patterns; preserve evidence and mark superseded lessons. Implementation convergence must not suppress independent criticism. Do not create a new architecture or revise product intent silently.
