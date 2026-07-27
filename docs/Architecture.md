# Architecture

FastRep is organized as a modular React Native application.

```text
UI
  ↓
Presenters / hooks
  ↓
Module API / services
  ↓
libs/requester
  ↓
FastRep backend
```

State responsibilities:

- React Query — server state.
- Zustand — local application state.
- MMKV — non-sensitive persistent preferences.
- Keychain — authentication tokens and secrets.

Module structure:

```text
modules/
  auth/
    API/
    models/
    presenters/
    types/
    ui/
      components/
      LoginView/
        index.tsx
        styles.ts
        types.ts
        presenters/
```

Screens and feature components stay inside modules. App-wide visual components belong in UIKit. Infrastructure must not depend on React Context or feature modules. UIKit must not depend on feature business logic.
