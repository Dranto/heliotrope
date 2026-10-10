# Heliotrope

A solarpunk incremental (idle/clicker) game for the browser.

Game mechanics, balancing and tone are defined in [`docs/game-design.md`](docs/game-design.md).

## Getting started

Requires Node.js 22 (see `.nvmrc`).

```sh
npm install
npm run dev      # start the dev server at http://localhost:5173
```

## Commands

| Command                | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `npm run dev`          | Dev server with hot reload                         |
| `npm run build`        | Typecheck and build the production bundle (`dist`) |
| `npm run preview`      | Serve the production build locally                 |
| `npm run simulate`     | Print the balancing simulator's pacing table       |
| `npm test`             | Run the test suite once (Vitest)                   |
| `npm run test:watch`   | Run tests in watch mode                            |
| `npm run lint`         | ESLint                                             |
| `npm run format`       | Format everything with Prettier                    |
| `npm run format:check` | Check formatting                                   |
| `npm run typecheck`    | TypeScript type check                              |
| `npm run check`        | Lint, format check, typecheck and tests            |

## Stack

Vite, TypeScript, React, Vitest with Testing Library, ESLint and Prettier.

## Deployment

Every push to `main` is built and deployed to GitHub Pages by
`.github/workflows/deploy.yml`. In the repository settings, Pages must use
**GitHub Actions** as its source. The site is served at
`https://dranto.github.io/heliotrope/`.
