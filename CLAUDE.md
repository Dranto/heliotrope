# Heliotrope

Solarpunk incremental (idle/clicker) web game. Vite + TypeScript + React, tested with Vitest.

## Source of truth

`docs/game-design.md` defines mechanics, balancing and tone. Gameplay code must follow it; when
a design decision changes, update that document in the same PR.

## Commands

- `npm run dev`: dev server
- `npm run check`: lint, format check, typecheck and tests (run before every push). Lint,
  Prettier and tsc cache in `node_modules/.cache/`, so a re-run only checks changed files
- `npm test`: tests only; `npx vitest run path/to/file.test.ts` for one file (fast; use it while
  iterating, then `npm run check` once before pushing)
- `npm run build`: production build
- `npm run simulate [clicksPerSecond]`: print the balancing simulator's pacing table
- `npm run format`: fix formatting
- `npm run -s doc -- design [section]`: print one section of `docs/game-design.md` (e.g. `7.1`),
  or its table of contents with line counts; `npm run -s doc -- roadmap [heading]` for the roadmap

## Reading efficiently

- The design doc is ~690 lines and the roadmap ~220: read the section you need with
  `npm run -s doc`, not the whole file. The `§` numbers in this file are design doc sections.
- Large files (`src/ui/App.css`, `Neighbourhood.tsx`, `RestorationArt.tsx`, `Flower.tsx`): grep
  for the selector or symbol, then read that range.
- Never read `package-lock.json` or `dist/`.

## Layout

- `src/game/`: the simulation, framework-free and pure. No React or DOM imports here.
  - `resources.ts`: resource ids (the MVP has one currency, Light)
  - `generators.ts`: generator data table (base cost and production); add generators here
  - `upgrades.ts`: upgrade data table (×2 per generator, click upgrades, synergies)
  - `production.ts`: pure formulas: production, multipliers, biodiversity, click value, costs,
    upgrade availability
  - `seasons.ts`: prestige (design doc §7): Seeds formula, bonus, `startNewSeason`
  - `talents.ts`: the Tree of Seasons (§7.1), talents bought with Seeds, kept across Seasons;
    `cooperatives.ts`: the Cooperatives (§7.2) that buy for the player, run by every tick
  - `achievements.ts`: Milestones ("Jalons", §9.3) data table, +1% bonus, unlock checks
  - `butterfly.ts`, `effects.ts`: the Golden Butterfly (§9.2), its schedule and timed effects
  - `parcels.ts`, `projects.ts`: parcels to restore (kept across Seasons) and neighbourhood
    projects (per Season), data tables (§6.1, §6.2); `bonuses.ts` reads their shared effect
    shape for the formulas; `restoration.ts` holds when they are offered and the buy actions
  - `species.ts`: the Herbier (§9.5), species that return on game conditions and add biodiversity;
    `challenges.ts`: challenge Seasons (§7.3), their constraints, goals and rewards
  - `phases.ts`: progression phases and visual seasons of the scene (§6)
  - `random.ts`: seeded random numbers; the seed lives in `GameState` so random events stay pure
  - `state.ts`: `GameState` shape, `STATE_VERSION`, initial state
  - `tick.ts`: `tick(state, dtSeconds)` and player actions; pure functions returning new state
  - `offline.ts`: offline progress on load, capped by `MAX_OFFLINE_SECONDS`, simulated in chunks
  - `save.ts`: localStorage save/load with versioned migrations, base64 export/import
  - `simulator.ts`: headless balancing simulator (design doc §8); its test keeps the pacing
    targets within ±30%
  - `store.ts`: `GameStore`, which owns live state, the tick interval and autosave
  - `format.ts`: number formatting for display (French notation, design doc §8)
- `src/i18n/`: every player-facing text (UI strings, generator, upgrade and Milestone names,
  flavour lines). `fr.ts` is the reference and defines `Texts`; `en.ts` has the same shape. Read
  texts through `t` from `src/i18n/index.ts`, which follows the language chosen in the Options;
  add a key to both files.
- `src/ui/`: React components. `Neighbourhood.tsx` draws the top-down city scene from the plan and
  rules in `neighbourhood.ts` (design doc §6); `RestorationArt.tsx` and `restorationMap.ts` draw
  the restored parcels and project marks, `Restoration.tsx` is their panel in the side menu.
  `Scene.tsx` frames the map with the view switch (`fitCamera`) and stands the clickable `Flower.tsx` in the courtyard (`flowerFrame`);
  `PanelTitle.tsx` and `layoutPrefs.ts` fold the panels and remember layout choices per browser.
  `Herbier.tsx` is the Herbier screen, `speciesDrawings.tsx` the species drawings, `SpeciesLife.tsx`
  and `speciesMap.ts` the species on the map.
  `SeasonTree.tsx` and `seasonTree.ts` draw the Tree of Seasons screen; `Cooperatives.tsx` is their
  panel, `CooperativeArt.tsx` and `cooperativeMap.ts` their cargo bikes on the map.
  `sound.ts` synthesises the discreet sounds and `useSounds.ts` plays them from state changes.
  Read state with `useGameState()`, change it with `store.dispatch((s) => action(s))`.

## Conventions

- Code, comments and commit messages in English.
- One branch and one draft PR per task. Never push to `main`. CI must be green before review.
- Many threads merge in parallel: before every push and before merging, merge the latest `main`
  into your branch and resolve conflicts yourself, without waiting to be asked.
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
