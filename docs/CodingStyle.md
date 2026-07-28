# Coding Style

`AGENTS.md` is the authoritative source for mandatory governance. This document
expands the component and rendering conventions.

## Components

Use named `const` arrow functions and named exports. Do not use function declarations or default exports for components.

## Files

Each component or screen has its own folder and uses `index.tsx` as its implementation file:

```text
Button/
  index.tsx
  styles.ts
```

When the component owns behavior:

```text
ReportDetailsView/
  index.tsx
  styles.ts
  presenters/
    useReportDetailsViewPresenter.ts
```

Do not use `index.ts` or `index.tsx` as a re-export barrel. Screen folders and exported screen components must end with `View`, not `Screen`.
An implementation `index.tsx` is required by the component convention and is distinct
from a forbidden re-export-only `index.ts`.

A separate `types.ts` is optional only for genuinely shared, exported,
non-local component contracts used by more than one file.

## Handlers

Use `on`, not `handle`. Avoid inline handlers in JSX.

## Imports

Use `@` alias, named exports, `import type`, and avoid circular dependencies.
Import order is not enforced.

## Types

Declare component-local props in `index.tsx` and name the interface `IProps`,
including for exported components:

```tsx
interface IProps {
  title: string;
}

export const ReportCard = ({ title }: IProps) => {
  return <Typography>{title}</Typography>;
};
```

Do not create `ReportCard/types.ts` when it would contain only `IProps`.
Domain and API contracts remain in the relevant entity. Navigation types remain
in the navigation layer. Reserve `src/types` for truly application-global
technical types that cannot belong to an entity. Do not inline genuinely shared
contracts into components. Avoid `any`; use `unknown`.

## Presenters

A presenter owned by one screen or component must live in that owner's
`presenters/` folder.

Good:

```text
ReportDetailsView/presenters/useReportDetailsViewPresenter.ts
```

Bad:

```text
modules/reports/presenters/useReportDetailsViewPresenter.ts
ReportDetailsView/useReportDetailsViewPresenter.ts
```

Only query hooks, mutation hooks, and orchestration genuinely shared by
multiple screens may live in a clearly shared module or entity location.

## UI placement

Keep a one-screen component under that screen:

```text
ReportsListView/components/ReportCard/
```

Move it to `modules/reports/ui/components/` only when at least two reports
screens actually use it. Do not place report-specific components in UIKit.

## Screen state rendering

Render common screen infrastructure once. Loading, error, empty, and content
states should change the body, not repeat `ScreenContainer`, `Header`, SafeArea
configuration, providers, or shared padding and layout.

Good:

```tsx
return (
  <ScreenContainer headerComponent={<Header title={title} />}>
    {isLoading ? <Loader /> : <ReportDetails />}
  </ScreenContainer>
);
```

Bad: three return branches that each repeat the same `ScreenContainer` and
`Header`. A repeated shell is allowed only when states require fundamentally
different screen behavior.

## Domain boundaries

Modules contain UI and presenters. Presenters coordinate entity APIs and models but do not own reusable domain, token, or session logic. Entities contain domain logic and must not import modules. Generic libs must not import modules and should not depend on entities.

## Branching

Prefer early returns and shallow conditions. Use `switch` when it is clearly better for finite states or variant mapping.

## Simplicity

Choose the simplest implementation that meets the current requirement.
Introduce an abstraction only when it removes real duplication in at least two
places or establishes a genuine project-wide boundary. Avoid one-use wrappers,
hooks, classes, helpers, and generic components, and do not design for
hypothetical future requirements. A local one-off helper is appropriate when
it materially improves readability without pretending to be reusable.

## Cleanup

Remove dead code, unused exports, debug logs, and commented-out code.
