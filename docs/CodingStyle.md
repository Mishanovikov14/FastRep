# Coding Style

## Components

Use named `const` arrow functions and named exports. Do not use function declarations or default exports for components.

## Files

Each component or screen has its own folder and uses `index.tsx` as its implementation file:

```text
Button/
  index.tsx
  styles.ts
  types.ts
```

Do not use `index.ts` or `index.tsx` as a re-export barrel. Screen folders and exported screen components must end with `View`, not `Screen`.
An implementation `index.tsx` is required by the component convention and is distinct
from a forbidden re-export-only `index.ts`.

## Handlers

Use `on`, not `handle`. Avoid inline handlers in JSX.

## Imports

Use `@` alias, named exports, `import type`, and avoid circular dependencies.
Import order is not enforced.

## Types

Domain types belong in the relevant entity. Component-local exported types go to the component's `types.ts`, and its props interface is `IProps`. Reserve `src/types` for truly application-global technical types that cannot belong to an entity. Avoid `any`; use `unknown`.

## Domain boundaries

Modules contain UI and presenters. Presenters coordinate entity APIs and models but do not own reusable domain, token, or session logic. Entities contain domain logic and must not import modules. Generic libs must not import modules and should not depend on entities.

## Branching

Prefer early returns and shallow conditions. Use `switch` when it is clearly better for finite states or variant mapping.

## Cleanup

Remove dead code, unused exports, debug logs, and commented-out code.
