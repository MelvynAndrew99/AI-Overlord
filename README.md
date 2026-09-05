# AI Overlord

A father-and-son RUN.world Back to Work jam project. Master an AI's increasingly chaotic job, accumulate tokens, and decide what to do when mistakes become affordable.

## Development environment

Use Ubuntu/WSL on x86_64 with Nix flakes enabled. The flake pins nixpkgs through flake.lock and packages RUN CLI 7.14.3 with a verified release checksum. It supplies Node.js 24, npm, Git, curl, ripgrep, and the RUN CLI with its native libraries.

From Ubuntu:

```bash
cd /home/phil/Code/jams/AI-Overlord
nix develop
npm ci
npm run dev
```

Open http://localhost:5173 on this computer. The flake files are visible to Git (intent-to-add), so ordinary nix develop works. No nix-env installation is required.

From PowerShell, first enter Ubuntu:

```powershell
wsl -d Ubuntu
```

Then use the commands above. Keep npm installation and builds inside the Nix shell rather than mixing Windows npm with WSL dependencies.

## Current milestone

This is the official September Jam Bare Bones starter, not yet the traffic gameplay prototype. The template contains a bouncing-sprite demo, React menu/HUD, Pixi rendering, and RUN SDK lifecycle and save integration.

```bash
npm run build          # TypeScript check and production build
npm run build:bundled  # Standalone production bundle
npm run preview        # Preview the latest production build
rundot --version
```

## RUN account and deployment

```bash
rundot login
rundot whoami
```

RUN sign-in was completed during initial setup. On another computer or after session expiry, complete sign-in in your browser. If WSL cannot open the browser, use the login URL printed by the CLI. Do not put account credentials in the repository.

AI Overlord is registered and privately deployed on RUN (game ID l7mD5BHH8LslWkr5mC7d). Version 1.0.1 is the starter demo with the accepted cover and an explicit prototype label. Traffic gameplay is next. Use rundot game info to retrieve the private share link.

For each iteration, inside nix develop:

```bash
npm run dev       # local iteration
npm run deploy    # type-check, build, and update the private game
```

Do not run rundot init again for this game. Preserve game.config.prod.json and its kitId, plus rundot/kit.json. The current public/thumbnail.jpg is the accepted city cover. Future art changes remain reviewable candidates until selected.

Live text generation is explicitly disabled in rundot/textGen.config.json; the current prototype needs no runtime model calls. The CLI initially auto-enabled it, and private version 1.0.1 applies the opt-out.

Public publishing is a separate decision after a playable traffic shift is ready. Keep --public out of routine deployment commands.

The jam requires an eligible starter and public submission before September 14, 2026 at noon Pacific. See https://events.run.world/events/september-2026-jam/ for current rules.

## Project documents

- docs/DESIGN.md: agreed concept, prototype scope, open economy questions, and later roles.
- docs/DEVLOG.md: setup evidence and recording notes.
- docs/RUN-TEMPLATE.md: preserved upstream starter README.
- CLAUDE.md: upstream architecture and SDK conventions.

Source: https://github.com/series-ai/september-jam-barebones, scaffolded using rundot jam init september-jam-barebones.

Temporary bootstrap downloads live under ignored .tools/; the Nix environment does not depend on them.
