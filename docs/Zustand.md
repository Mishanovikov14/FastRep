# Zustand

Use Zustand for local application state only, such as authenticated user/session state, startup state, UI preferences, and non-server feature state.

- Domain stores belong in the relevant entity's `model/` folder. The current-user store is `entities/user/model/userStore.ts`.
- Do not place domain stores in a generic global `src/storage` folder.
- Do not duplicate React Query data in Zustand.
- Stores must not contain UI rendering.
- Persist only non-sensitive state through the storage wrapper.
- Tokens stay in Keychain.
- Keep stores focused and small.
