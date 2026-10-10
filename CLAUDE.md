# Heliotrope

Solarpunk incremental (idle/clicker) web game. Vite + TypeScript + React, tested with Vitest.

## Source of truth

`docs/game-design.md` defines mechanics, balancing and tone. Gameplay code must follow it; when
a design decision changes, update that document in the same PR.

## Commands

- `npm run dev`: dev server
- `npm run check`: lint, format check, typecheck and tests (run before every push)
- `npm test`: tests only; `npx vitest run path/to/file.test.ts` for one file
- `npm run build`: production build
- `npm run simulate [clicksPerSecond]`: print the balancing simulator's pacing table
- `npm run format`: fix formatting

## Layout

- `src/game/`: the simulation, framework-free and pure. No React or DOM imports here.
  - `resources.ts`: resource ids (the MVP has one currency, Light)
  - `generators.ts`: generator data table (base cost and production); add generators here
  - `upgrades.ts`: upgrade data table (×2 per generator, click upgrades, synergies)
  - `production.ts`: pure formulas: production, multipliers, biodiversity, click value, costs,
    upgrade availability
  - `state.ts`: `GameState` shape, `STATE_VERSION`, initial state
  - `tick.ts`: `tick(state, dtSeconds)` and player actions; pure functions returning new state
  - `offline.ts`: offline progress on load, capped by `MAX_OFFLINE_SECONDS`, simulated in chunks
  - `save.ts`: localStorage save/load with versioned migrations, base64 export/import
  - `simulator.ts`: headless balancing simulator (design doc §8); its test keeps the pacing
    targets within ±30%
  - `store.ts`: `GameStore`, which owns live state, the tick interval and autosave
  - `format.ts`: number formatting for display (French notation, design doc §8)
- `src/i18n/fr.ts`: every player-facing text (UI strings, generator and upgrade names and
  flavour lines).
- `src/ui/`: React components. Read state with `useGameState()`, change it with
  `store.dispatch((s) => action(s))`.

## Conventions

- Code, comments and commit messages in English.
- One branch and one draft PR per task. Never push to `main`. CI must be green before review.
- Game logic changes come with unit tests in `src/game/*.test.ts`.
- State transitions are pure: never mutate `GameState` in place.
- Time-based logic uses elapsed real time (`dtSeconds`), never a fixed tick count, so throttled
  tabs and offline progress behave the same as foreground play.
- Changing the shape of `GameState` means bumping `STATE_VERSION` and adding a migration in
  `save.ts` so existing players keep their saves.
- Numbers are plain JS `number` for now. Switch to a big-number library only when the design
  doc's progression needs values past ~1e308.

## Reviews and bug fixes

- `REVIEW.md` lists what blocks a PR and what is optional.
- `.claude/agents/code-reviewer.md` reviews a PR; `.claude/agents/bug-fixer.md` fixes one bug
  with a regression test. A scheduled Claude routine runs both on open PRs and on issues
  labelled `bug`.
