# Architecture

FastRep uses an entity-oriented architecture.

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
