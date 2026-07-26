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

## Handlers

Use `on`, not `handle`. Avoid inline handlers in JSX.

## Imports

Use `@` alias, named exports, `import type`, sorted imports, and avoid circular dependencies.

## Types

Exported shared types go to `types.ts`. Component props interface is `IProps`. Avoid `any`; use `unknown`.

## Branching

Prefer early returns and shallow conditions. Use `switch` when it is clearly better for finite states or variant mapping.

## Cleanup

Remove dead code, unused exports, debug logs, and commented-out code.
