# Review guidelines

Automated and human reviews of Heliotrope pull requests follow these rules.

## Blocking

- CI fails (`npm run check` or `npm run build`).
- A bug with a concrete scenario: wrong production or cost maths, state mutated in place,
  time-based logic using tick counts, offline progress diverging from online play, NaN or
  Infinity reaching the state.
- A change to the shape of `GameState` without a `STATE_VERSION` bump and a migration in
  `src/game/save.ts`.
- Gameplay that contradicts `docs/game-design.md` without updating that document in the same PR.
- New game logic in `src/game/` without unit tests.
- React or DOM imports in `src/game/`.

## Optional

- Naming, readability and small simplifications.
- UI polish that does not change behaviour.

Optional findings never block a merge.
