# Minimal Template for RUN.game

The blank-slate starting point in this kit: Pixi.js v8, React 19, Tailwind CSS v4, TypeScript, Vite, and the RundotGameAPI SDK wired together with the platform patterns already in place (SDK boot order, host lifecycles, per-player saves, design-unit stage, safe areas) — and no genre assumptions. A bouncing-sprite demo scene proves the whole pipeline; delete it and build your game.

Start here when your game is not a tower defense. If it is, use the tower defense template ([series-ai/september-jam-tower-defense](https://github.com/series-ai/september-jam-tower-defense)) instead — and either way, it contains working systems you can copy into this one when you need them (audio + settings, leaderboards, rewarded ads, a persistent meta economy). More platform systems (daily rewards, IAP, quests, tutorial) are available as copy-in modules from the [`@series-inc/run-game-helpers`](https://www.npmjs.com/package/@series-inc/run-game-helpers) npm package. For platform details, see the [RUN.game developer docs](https://series-1.gitbook.io/rundot-docs).

## Quick Start

```bash
npm install
npm run dev            # http://localhost:5173
```

You should see: black cover → loading bar 0→100% → main menu → Play → a bouncing sprite with a HUD counter, and a best score that survives a reload (saved to localStorage in the browser, to RUN per-player cloud storage in the host). That demo scene is yours to replace.

## What's Wired Up

- **Boot sequence** (`src/main.tsx`) — SDK init, save load, React mount, anti-black-screen boot cover, asset warming with progress, lifecycle hooks, analytics; numbered and ordered the way production RUN games do it
- **Saves** (`src/state/save.ts`) — write-through to RUN `appStorage` + localStorage, flushed on the host's sleep/quit lifecycles; extend `SaveData` with your fields
- **Design-unit stage** (`src/game/stage.ts`) — position everything in 720-wide design units and every device renders it proportionally
- **React ↔ Pixi split** — React owns screens/HUD, Pixi owns the game, a tiny store bridges them on discrete events

## Deploy to RUN.game

Needs the [RUN.game CLI](https://github.com/series-ai/rundot-cli-releases).

```bash
rundot login
rundot init --name <your-game> --description "<desc>" --build-path dist --orientation Portrait
npm run build
rundot deploy
```

`rundot init` runs ONCE per game (it registers the game and fills in `game.config.prod.json` — the repo ships that file with the kit's `kitId` baked in, which is what enters your game in the jam, so don't delete it); after that, iterating is just `npm run build && rundot deploy`. Deploys are **private by default** — playable by you via your profile / `rundot list-games`, but not listed on the Explore page until you deploy with `--public`.

Before your first deploy, replace `public/thumbnail.jpg` with your game's tile art — **exactly 512×512, JPG** (`rundot deploy` rejects placeholders and wrong dimensions).

## Where Things Live

```
index.html               // locked mobile viewport + boot cover (anti-black-screen safety net)
src/main.tsx             // entry point — the boot sequence, in the order that matters
src/sdk/runSdk.ts        // SDK init (never throws) + lifecycle registration
src/state/store.ts       // tiny external store bridging game code <-> React
src/state/save.ts        // per-player save: RUN appStorage + localStorage write-through
src/assets/manifest.ts   // asset list: critical (awaited) / deferred (background)
src/assets/preload.ts    // warmAssets() via Pixi Assets bundles
src/game/pixiApp.ts      // Pixi Application factory (DPR cap, transparent canvas)
src/game/stage.ts        // design-resolution stage — position in design units, not pixels
src/game/GameCanvas.tsx  // React <-> Pixi boundary; StrictMode-safe mount/destroy
src/game/demoScene.ts    // throwaway demo scene — replace with your game
src/ui/                  // React screens: App (phase router), LoadingScreen, MainMenu, Hud
src/styles/app.css       // Tailwind import, @theme palette, device-frame CSS
public/                  // small static assets that ship with the app
public/cdn-assets/       // large assets deployed to the CDN (see its README)
game.config.prod.json    // ships with the kit's kitId; rundot init fills in the rest
```

All intended edit points carry `ADAPT:` comments — search the source for `ADAPT:`. Architecture details and conventions are in CLAUDE.md.

## RUN.game Tips

- Use `RundotGameAPI.log()` for debug messages so they show up inside the RUN.game host.
- Need storage, ads, haptics, or CDN helpers? The [RundotGameAPI docs](https://series-1.gitbook.io/rundot-docs) walk through every API with examples.
- Jump into `src/game/demoScene.ts` to start remixing. Have fun ⚡️