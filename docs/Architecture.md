# Architecture

FastRep uses an entity-oriented architecture.

`AGENTS.md` is the authoritative source for mandatory governance. This document
explains layer and ownership details without replacing those rules.

```text
modules
  ↓
entities
  ↓
libs
```

- `modules/` contains UI and presenters.
- `entities/` contains domain data, APIs, models, state, services, and domain types.
- `libs/` contains generic technical infrastructure.

Modules may import entities and libs. Entities may import libs but never modules. Generic libs must not import modules and should not depend on entities. UIKit must not depend on modules or entities. Navigation may read entity state and render modules.

## Module UI ownership

Screens live under `modules/<module>/ui/<ScreenName>View/`. Placement of a
visual component follows its actual consumers:

```text
modules/reports/ui/
  ReportsListView/
    components/
      ReportCard/
        index.tsx
        styles.ts
  ReportDetailsView/
  components/
    ReportStatusBadge/  # only if at least two reports screens use it
```

- A component used by one screen stays in that screen's `components/` folder.
- `modules/<module>/ui/components/` is only for components used by at least two
  screens in that module.
- Do not duplicate a shared module component inside individual screens.
- Module-specific components do not move to UIKit merely because more than one
  screen in the same module uses them.
- UIKit is for global visual primitives used across independent modules.

## Presenter and orchestration ownership

Screen- and component-specific presenters are nested under their owner:

```text
ReportDetailsView/
  index.tsx
  styles.ts
  presenters/
    useReportDetailsViewPresenter.ts
```

Do not put that presenter in `modules/reports/presenters/`, directly beside
`index.tsx`, or in another generic presenter folder.

The owner presenter contains meaningful presentation behavior: navigation,
event handling, effects, local state orchestration, data transformation,
behavioral derivation, and query or mutation coordination. The owner's
`index.tsx` remains focused on rendering, theme values used directly by JSX,
styles, prop forwarding, and simple conditional UI.

A purely visual component remains presenter-free. Do not create a presenter
that only echoes props or hides a trivial expression.

Shared React Query hooks, mutation hooks, or orchestration used by multiple
screens are different: they may live in a clearly shared reports module
location. Reusable domain behavior belongs in `entities/reports`; it must not
be hidden in a screen presenter.

## Visual asset ownership

SVG icons live as independent components in `src/assets/icons/`. UIKit and
modules may import them, but icons are assets rather than UIKit primitives.
UIKit must not depend on entities or modules, and assets must not import feature
code.

The current user and authentication lifecycle are owned by one entity:

```text
entities/user/
  API/userApi.ts
  model/userStore.ts
  services/
    authenticatedResourcesService.ts
    tokenRefreshService.ts
    userSessionService.ts
    userStateService.ts
    userTokenStorage.ts
  types/
    auth.ts
    session.ts
    user.ts
```

Auth screens and their presenters remain in `modules/auth/ui`. Application-level lifecycle orchestration remains in `hooks/` and `AppLifecycle.tsx`.

State responsibilities:

- React Query — server state.
- Entity Zustand stores — local domain state.
- MMKV — non-sensitive persistent preferences.
- Keychain — authentication tokens and secrets.
