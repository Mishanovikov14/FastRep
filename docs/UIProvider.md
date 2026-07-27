# UIProvider

`src/UIProvider` exposes colors, fonts, spacing, radius, language, supported languages, translation function, language switching, and initialization state.

Rules:

- No feature business logic or API calls.
- Localization resources remain in `src/localization`.
- Persistence is delegated to `libs/storage`.
- Use React state, `useMemo`, and `useCallback`.
- `useUIContext` must throw a clear error outside the provider.
- Infrastructure layers must not import UIProvider.
- Theme-dependent styles are created in UI components, not presenters.
- The provider component must be a named `const` arrow function.
