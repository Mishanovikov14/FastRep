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
- `UIKit/` — global visual components reusable across independent modules only.
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

Component-local props must be declared in the component's `index.tsx` and named
`IProps`. Do not create `types.ts` only to hold component props.

For a simple component:

```text
ComponentName/
  index.tsx
  styles.ts
```

For a component or screen with its own presenter:

```text
ComponentName/
  index.tsx
  styles.ts
  presenters/
    useComponentNamePresenter.ts
```

A separate `types.ts` is optional and allowed only for genuinely shared,
exported, non-local component contracts used by more than one file. Domain
types remain in the relevant entity. Navigation and application-global
technical types remain centralized in their existing owners. Do not inline
shared domain or API contracts into components.

Rules:

- JSX belongs in `index.tsx`.
- Styles belong in `styles.ts`.
- Component-local `IProps` belongs in `index.tsx`, even when the component is exported.
- Component-owned logic belongs in its nested `presenters/` folder or in a focused local hook.
- Component and screen folders use `index.tsx` as the implementation file.
- Screen folders and exported screen components must end with `View`, not `Screen`.

Good:

```tsx
interface IProps {
  title: string;
}

export const ReportCard = ({ title }: IProps) => {
  return <Typography>{title}</Typography>;
};
```

Bad: `ReportCard/types.ts` containing only `IProps`.

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

UI components may render JSX, use `useUiContext`, create theme-dependent styles
with `useMemo`, forward props, render simple conditions, define `keyExtractor`,
and contain very small callbacks required by library APIs when extraction would
reduce readability.

UI components must not contain API calls, business logic, storage access, token logic, request error handling, complex calculations, data transformation pipelines, Reanimated calculations, or temporary test logic.

All meaningful component behavior belongs in the owning component's presenter.
Move navigation and fallback navigation, event handlers, `useCallback`
callbacks, press-state style functions, local state orchestration, effects,
derived behavioral values, library interaction, behavior-derived accessibility
values, data transformation, validation, and query or mutation orchestration
out of `index.tsx`.

A visual-only component does not need a presenter. Do not create a fake
presenter that returns props unchanged or moves one trivial line. A presenter
is required when a component or screen contains real behavior or orchestration.

### Component ownership

A component used by only one screen must live under that screen:

```text
ReportsListView/
  components/
    ReportCard/
      index.tsx
      styles.ts
```

Use `modules/reports/ui/components/` only for a report UI component that is
actually used by at least two report screens. Do not promote screen-local
components into module-shared folders, duplicate a shared component in several
screens, or move a module-specific component into UIKit.

Good: `ReportsListView/components/ReportCard/` when only the list renders it.
Bad: `modules/reports/ui/components/ReportCard/` for one consumer.
Good: `modules/reports/ui/components/ReportStatusBadge/` when both list and
details screens render it.

UIKit is reserved for globally reusable visual components expected to be used
across independent modules. It may contain primitives such as Button, Input,
Header, Loader, ScreenContainer, EmptyState, and CustomAlert. It must not
contain domain-, report-, or screen-specific components, business logic,
entity dependencies, or a generic icon registry.

---

## 7. Presenters and shared orchestration

Presenters may contain handlers, coordinate entity APIs and entity models, use React Query, Zustand, navigation, validation orchestration, derived state, effects, request error handling, and Reanimated shared values/styles.

Presenters must not contain JSX, `useUiContext`, `keyExtractor`, or render
functions. Inputs and outputs must be minimal and explicit. Do not pass an
entire styles or theme object when the presenter needs only one or two values.
A presenter may accept specific style values to build a library-required
pressed-state callback, but it must not own visual styling or return raw theme
objects or colors unless strictly necessary.
Reusable domain, token, and session logic belongs in the relevant entity rather than in presenters.

If a screen or component owns a presenter, it must be nested in that owner's
folder:

```text
ReportDetailsView/
  presenters/
    useReportDetailsViewPresenter.ts
```

A component-specific presenter is forbidden in the module root, directly
beside `index.tsx`, or in a generic shared `presenters/` folder. Genuinely
shared query hooks, mutation hooks, and domain orchestration used by multiple
screens may live in a clearly shared module or entity location.

Good: `ReportDetailsView/presenters/useReportDetailsViewPresenter.ts`.
Bad: `modules/reports/presenters/useReportDetailsViewPresenter.ts`.

Good:

```tsx
const { getBackButtonStyle, onPressBack } = useHeaderPresenter({
  backButtonPressedStyle: styles.backButtonPressed,
  backButtonStyle: styles.backButton,
  onBackPress,
});

return <Pressable onPress={onPressBack} style={getBackButtonStyle} />;
```

Bad: keeping `navigation.goBack()`, a callback fallback chain, or a
`useCallback` press-state style function inside `Header/index.tsx`.

Use `on` naming, not `handle`.

---

## 8. Icons

Every icon must be an independent named React component in
`src/assets/icons/`, one icon per file, implemented with `react-native-svg`.
Expose explicit `width`, `height`, and `color` props where appropriate.

```text
src/assets/icons/
  ArrowBackIcon.tsx
  ProfileIcon.tsx
```

UIKit and modules may import icons from assets. Icons do not belong in UIKit.
Do not create a generic UIKit `Icon`, `switch(name)`, an icon-name string
union, or duplicate the same SVG path in several files.

Good (`src/assets/icons/ArrowBackIcon.tsx`):

```tsx
interface IProps {
  color: string;
  height?: number;
  width?: number;
}

export const ArrowBackIcon = ({ color, height = 24, width = 24 }: IProps) => {
  return (
    <Svg height={height} width={width}>
      <Path d="..." fill={color} />
    </Svg>
  );
};
```

Bad: `<Icon name="arrow-back" />`.

---

## 9. Screen rendering

Render a screen's shared shell once. Loading, error, empty, and content states
must switch only the changing body when they share the same ScreenContainer,
Header, SafeArea configuration, providers, padding, and layout.

Good:

```tsx
return (
  <ScreenContainer headerComponent={<Header title={t('reports.title')} />}>
    {isLoading ? <Loader /> : <ReportsContent />}
  </ScreenContainer>
);
```

Bad: separate early-return branches that repeat the same `ScreenContainer` and
`Header`. Duplicate the shell only when states require fundamentally different
screen behavior. Prefer a readable condition, a local helper, or a small local
content component; do not create a generic abstraction used only once.

---

## 10. Styles

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

## 11. Request errors

Every user-triggered request must be awaited by the presenter or hook that owns it. Always check `response.isError` and show the standard toast on failure. Unexpected failures must be caught, logged, and shown using the fallback toast.

Do not update success state before checking the request result.

---

## 12. Storage and tokens

- Use one MMKV instance behind `libs/storage`.
- Do not access MMKV directly throughout the app.
- Domain Zustand stores belong inside the relevant entity, not in a generic global `src/storage` folder.
- Do not store access or refresh tokens in MMKV.
- User tokens must use the Keychain-backed storage owned by `entities/user`.
- Do not log out immediately on every `401`.
- Refresh-token logic must attempt session renewal before clearing the session.

---

## 13. Imports and types

- Use the `@` alias for imports from `src`.
- Use named exports.
- Use `import type` for type-only imports.
- Avoid circular dependencies.
- Domain types belong inside the relevant entity.
- `src/types` is reserved for truly application-global technical types that cannot belong to an entity.
- Component-local props belong in the component's `index.tsx` and are named `IProps`.
- A component `types.ts` is allowed only for shared exported contracts used by more than one file.
- Navigation types remain in the navigation layer; do not relocate them into components.
- Do not use `any`; use `unknown` and narrowing.

---

## 14. Simplicity, files, and responsibilities

- Always choose the simplest implementation that satisfies the requirement.
- Create an abstraction only when it removes real duplication in at least two places or establishes a genuine project-wide boundary.
- Avoid wrappers, hooks, helpers, classes, and generic components used only once.
- Do not optimize for hypothetical future requirements or create architecture for a local problem.
- Prefer readable local code over theoretical reusability; do not over-engineer.
- A one-off helper is acceptable when it materially improves readability, but it must not pretend to be a reusable abstraction.
- Each file must have one primary responsibility.
- UI components should preferably stay under 200 lines.
- Presenters should preferably stay under 250 lines.
- Styles should preferably stay under 200 lines.
- Split files when responsibilities diverge, not only to satisfy a line count.
- Remove dead code, unused exports, commented-out code, debug code, and accidental `console.log`.

---

## 15. Verification policy

Do not run lint, TypeScript, tests, Android builds, iOS builds, CocoaPods, Gradle, E2E, CI, or other verification commands unless the user explicitly asks for verification.

During active development, make the requested code changes only. Run a full verification pass only when the user explicitly asks to run checks, prepare for PR or merge, verify the project, or prepare a release. Do not infer permission from task size.

---

## 16. Final checklist

Confirm folder structure, entity boundaries, local props placement, meaningful
behavior in owning presenters, no fake presenters, minimal presenter inputs,
icon ownership, component reuse level, a single shared screen shell, separate
styles, clean UI, named const components, no local barrels, no re-export
chains, handled request errors, Keychain token storage, correct aliases/imports,
and no unrelated changes. Confirm verification was run only when explicitly
requested.

---

## 17. Governance

`AGENTS.md` is project governance. Do not modify it in ordinary feature or bug-fix tasks. Modify it only when the user explicitly requests an architecture or governance rule change.
