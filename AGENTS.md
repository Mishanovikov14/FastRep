# AGENTS.md

## FastRep Mobile — Mandatory Rules

Read this file before every task.

Read the linked document only when the task touches that area:

- UI components or UIKit: `docs/UIKit.md`
- UIProvider, theme, colors, fonts, or language: `docs/UIProvider.md`
- Networking or API requests: `docs/Requester.md`
- Authentication or token handling: `docs/Auth.md`
- React Query: `docs/ReactQuery.md`
- Zustand or application state: `docs/Zustand.md`
- Localization: `docs/Localization.md`
- Reanimated or gestures: `docs/Animations.md`
- Naming, files, imports, exports, formatting: `docs/CodingStyle.md`
- Project layers and module boundaries: `docs/Architecture.md`

Do not read unrelated documents unless the task requires them.

---

## 1. Stack

FastRep uses React Native 0.86, TypeScript, New Architecture, React Navigation, TanStack React Query, Zustand, Axios, MMKV with Nitro Modules, Keychain, Reanimated, Worklets, Gesture Handler, and the `@` alias.

Do not add Redux, MobX, Expo runtime packages, duplicate storage libraries, or duplicate networking layers unless explicitly requested.

---

## 2. Top-level structure

```text
src/
  assets/
  constants/
  entities/
  hooks/
  libs/
    requester/
    storage/
    toast/
  localization/
  modules/
  navigation/
  theme/
  types/
  UIKit/
  UIProvider/
  utils/
  App.tsx
  AppProviders.tsx
```

Responsibilities:

- `modules/` — UI and presenters only.
- `entities/` — domain data, API, state, services, models, and domain types.
- `UIKit/` — reusable visual components only.
- `UIProvider/` — theme and localization context.
- `libs/` — generic technical infrastructure.
- `localization/` — i18next configuration, resources, language resolution.
- `hooks/` — reusable hooks.
- `utils/` — pure utilities.
- `types/` — truly application-global technical types that cannot belong to an entity.
- `constants/` — shared constants.

Dependency direction is `modules → entities → libs`.

- Modules may import entities and libs, but must not contain domain APIs, domain services, or domain stores.
- Entities may import libs and must never import modules.
- Generic libs must not import modules and should not depend on entities.
- UIKit must not depend on entities or modules.
- Navigation may read entity state and render modules.
- Authentication and the current-user lifecycle belong in `entities/user`.
- Inspect the relevant entity folder first for everything related to a domain object.

Do not create duplicate requester, storage, localization, theme, or toast implementations.

---

## 3. Component structure

A non-trivial component or screen must use:

```text
ComponentName/
  index.tsx
  styles.ts
  types.ts
  presenters/
    useComponentNamePresenter.ts
```

For a simple purely visual component:

```text
ComponentName/
  index.tsx
  styles.ts
  types.ts
```

Rules:

- JSX belongs in `index.tsx`.
- Styles belong in `styles.ts`.
- Exported props and shared component types belong in `types.ts`.
- Logic belongs in presenters or focused hooks.
- Exported component props must be named `IProps`.
- Component and screen folders use `index.tsx` as the implementation file.
- Screen folders and exported screen components must end with `View`, not `Screen`.

---

## 4. React component declaration style

All React components must be named `const` arrow functions.

```tsx
export const Button = ({ title, onPress }: IProps) => {
  return <Pressable onPress={onPress} />;
};
```

Forbidden:

```tsx
export function Button(props: IProps) {
  return <Pressable />;
}
```

Also forbidden:

```tsx
export default function Button() {
  return null;
}
```

Named exports are required. Avoid `React.FC`. Project hooks and utilities should also use `const` arrow functions unless a technical requirement prevents it.

---

## 5. No local barrel files

Local barrel files are forbidden.

Do not create `index.ts` or `index.tsx` files whose only purpose is re-exporting sibling files.
An `index.tsx` containing the component implementation is required and is not a barrel.
An implementation `index.tsx` and a re-export-only `index.ts` are different cases:
keep the former and do not create the latter.

Forbidden:

```ts
export { UIProvider } from './UIProvider';
export { useUIContext } from './useUIContext';
export type { UIContextValue } from './types';
```

Use direct imports:

```ts
import { UIProvider } from '@/UIProvider/UIProvider';
import { useUIContext } from '@/UIProvider/useUIContext';
import type { UIContextValue } from '@/UIProvider/types';
```

Only deliberate top-level library APIs may keep a barrel. Do not create `src/UIKit/index.ts`; import UIKit components directly from their folders. Re-export chains are forbidden.

---

## 6. UI components must stay clean

UI components may render JSX, use `useUiContext`, create theme-dependent styles with `useMemo`, define `keyExtractor`, and contain callbacks required by library APIs.

UI components must not contain API calls, business logic, storage access, token logic, request error handling, complex calculations, data transformation pipelines, Reanimated calculations, or temporary test logic.

Move behavior into presenters or focused hooks.

---

## 7. Presenters

Presenters may contain handlers, coordinate entity APIs and entity models, use React Query, Zustand, navigation, validation orchestration, derived state, effects, request error handling, and Reanimated shared values/styles.

Presenters must not contain JSX, styles, theme colors, `useUiContext`, `keyExtractor`, or render functions.
Reusable domain, token, and session logic belongs in the relevant entity rather than in presenters.

Use `on` naming, not `handle`.

---

## 8. Styles

Every component with styles must have its own `styles.ts`.

```ts
export const getStyles = (colors: IColors) => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return styles;
};
```

Inside the component:

```ts
const { colors } = useUiContext();
const styles = useMemo(() => getStyles(colors), [colors]);
```

Presenters must not receive or return colors or styles. Do not place large `StyleSheet.create(...)` blocks in component files. Use scaling helpers where appropriate and do not double-scale values.

---

## 9. Request errors

Every user-triggered request must be awaited by the presenter or hook that owns it. Always check `response.isError` and show the standard toast on failure. Unexpected failures must be caught, logged, and shown using the fallback toast.

Do not update success state before checking the request result.

---

## 10. Storage and tokens

- Use one MMKV instance behind `libs/storage`.
- Do not access MMKV directly throughout the app.
- Domain Zustand stores belong inside the relevant entity, not in a generic global `src/storage` folder.
- Do not store access or refresh tokens in MMKV.
- User tokens must use the Keychain-backed storage owned by `entities/user`.
- Do not log out immediately on every `401`.
- Refresh-token logic must attempt session renewal before clearing the session.

---

## 11. Imports and types

- Use the `@` alias for imports from `src`.
- Use named exports.
- Use `import type` for type-only imports.
- Avoid circular dependencies.
- Domain types belong inside the relevant entity.
- `src/types` is reserved for truly application-global technical types that cannot belong to an entity.
- Component-local shared types belong in the component's `types.ts`.
- Small local non-exported types may stay in their implementation file.
- Do not use `any`; use `unknown` and narrowing.

---

## 12. Files and responsibilities

- Each file must have one primary responsibility.
- UI components should preferably stay under 200 lines.
- Presenters should preferably stay under 250 lines.
- Styles should preferably stay under 200 lines.
- Split files when responsibilities diverge, not only to satisfy a line count.
- Remove dead code, unused exports, commented-out code, debug code, and accidental `console.log`.

---

## 13. Verification policy

Do not run lint, TypeScript, tests, Android builds, iOS builds, CocoaPods, Gradle, E2E, CI, or other verification commands unless the user explicitly asks for verification.

During active development, make the requested code changes only. Run a full verification pass only when the user explicitly asks to run checks, prepare for PR or merge, verify the project, or prepare a release. Do not infer permission from task size.

---

## 14. Final checklist

Confirm folder structure, entity boundaries, separate styles/types, clean UI, named const components, no local barrels, no re-export chains, handled request errors, Keychain token storage, correct aliases/imports, and no unrelated changes. Confirm verification was run only when explicitly requested.

---

## 15. Governance

`AGENTS.md` is project governance. Do not modify it in ordinary feature or bug-fix tasks. Modify it only when the user explicitly requests an architecture or governance rule change.
