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
  API/
  assets/
  constants/
  hooks/
  libs/
    requester/
    storage/
    toast/
  localization/
  modules/
  navigation/
  services/
  storage/
  theme/
  types/
  UIKit/
  UIProvider/
  utils/
  App.tsx
  AppProviders.tsx
```

Responsibilities:

- `modules/` — product features and screens.
- `UIKit/` — reusable visual components only.
- `UIProvider/` — theme and localization context.
- `libs/` — technical infrastructure.
- `storage/` — Zustand stores and application state.
- `services/` — application-level services.
- `localization/` — i18next configuration, resources, language resolution.
- `hooks/` — reusable hooks.
- `utils/` — pure utilities.
- `types/` — global shared types.
- `constants/` — shared constants.

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

Presenters may contain handlers, API calls, React Query, Zustand, navigation, validation orchestration, derived state, effects, request error handling, and Reanimated shared values/styles.

Presenters must not contain JSX, styles, theme colors, `useUiContext`, `keyExtractor`, or render functions.

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
- Do not store access or refresh tokens in MMKV.
- Tokens must use Keychain.
- Do not log out immediately on every `401`.
- Refresh-token logic must attempt session renewal before clearing the session.

---

## 11. Imports and types

- Use the `@` alias for imports from `src`.
- Use named exports.
- Use `import type` for type-only imports.
- Avoid circular dependencies.
- Shared exported types belong in `types.ts`, `types/`, or `enums/`.
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

## 13. Quality checks

Before finishing:

```bash
npm run lint
npm test -- --runInBand
npx tsc --noEmit
```

For native infrastructure changes also verify iOS build, Android build, CocoaPods when needed, no Reanimated/Worklets warnings, and no Nitro Modules linking errors.

---

## 14. Final checklist

Confirm folder structure, separate styles/types, clean UI, named const components, no local barrels, no re-export chains, handled request errors, Keychain token storage, correct aliases/imports, passing checks, and no unrelated changes.
