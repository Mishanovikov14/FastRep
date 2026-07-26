# AGENTS.md

## FastRep Mobile — Mandatory Architecture and Code Style Rules

These rules apply to all new code and refactoring in the FastRep React Native application.

The project uses:

- React Native 0.86
- TypeScript
- React Native New Architecture
- React Navigation
- TanStack React Query
- Zustand
- Axios
- React Native MMKV with Nitro Modules
- React Native Keychain
- React Native Reanimated
- React Native Worklets
- React Native Gesture Handler
- `@` path alias

The goal is predictable structure, clean UI components, isolated logic, reusable infrastructure, and easy code review.

---

## 1. Project architecture

Use this top-level structure:

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
- `UIKit/` — reusable visual components shared across the application.
- `UIProvider/` — theme and localization context exposed to UI.
- `libs/` — reusable technical infrastructure such as requester, storage, and toast.
- `storage/` — Zustand stores and application state.
- `services/` — application-level services and orchestration.
- `localization/` — i18next configuration, resources, and language resolution.
- `theme/` — shared theme constants when they are not owned directly by `UIProvider`.
- `types/` — global shared types.
- `hooks/` — global reusable hooks.
- `utils/` — pure utility functions.
- `constants/` — shared constants.

Do not create duplicate implementations of requester, storage, localization, theme, or toast.

---

## 2. Module structure

Each product module must follow a predictable structure.

Example:

```text
modules/
  auth/
    API/
    models/
    presenters/
    types/
    UI/
      components/
      LoginScreen/
        presenters/
        components/
        index.tsx
        styles.ts
        types.ts
```

Rules:

- A module must contain `UI/`.
- Reusable components inside one module belong in `UI/components/`.
- Components used by only one screen belong inside that screen's `components/`.
- Shared module types belong in the module's `types/`.
- API request functions for a module belong in the module's `API/`.
- Avoid unnecessary nesting and chains such as `components/.../components/...`.
- A nested `components/` folder is allowed only when the parent screen or UIKit component genuinely owns local subcomponents.

---

## 3. Component file structure

A non-trivial screen or component must not mix UI, styles, shared types, and logic in one file.

Preferred structure:

```text
ComponentName/
  presenters/
    useComponentNamePresenter.ts
  index.tsx
  styles.ts
  types.ts
```

For a simple purely visual component with no behavior:

```text
ComponentName/
  index.tsx
  styles.ts
  types.ts
```

Rules:

- `index.tsx` contains JSX and minimal UI integration only.
- `styles.ts` contains styles.
- `types.ts` contains exported props and shared component types.
- `presenters/` contains handlers, derived state, asynchronous behavior, and orchestration.
- Small local non-exported types may stay in the file where they are used.
- Exported component props must be named `IProps`.

Do not put a large `StyleSheet.create(...)` block inside `index.tsx`.

---

## 4. UI components must stay clean

A UI component should:

- receive prepared data;
- receive prepared handlers;
- render JSX;
- resolve UIProvider values;
- create theme-dependent styles;
- contain only rendering-specific callbacks required by React Native or a library.

A UI component must not contain:

- API requests;
- business rules;
- storage operations;
- data transformations;
- complex calculations;
- temporary testing logic;
- token handling;
- request error handling;
- Reanimated calculations;
- large `map`, `filter`, or `reduce` pipelines;
- inline anonymous event handlers when they can be avoided.

Minimal rendering conditions such as `loading ? <Loader /> : <Content />` are allowed.

---

## 5. Presenters

Presenters are hooks that prepare data and behavior for UI.

Naming:

```text
useLoginScreenPresenter
useReportCardPresenter
useLanguageShowcasePresenter
```

A presenter may contain:

- event handlers;
- API calls;
- React Query hooks;
- Zustand access;
- storage access;
- navigation actions;
- derived state;
- validation orchestration;
- error handling;
- Reanimated shared values and animated styles;
- side effects related to screen behavior.

A presenter must not contain:

- JSX;
- React Native styles;
- theme colors;
- `useUiContext`;
- `keyExtractor`;
- render functions.

The presenter returns prepared values and stable handler references.

---

## 6. Types and enums

Rules:

- Exported or reusable interfaces, types, and enums belong in `types.ts`, `types/`, or `enums/`.
- Presenter-only local types may stay inside the presenter.
- UI-only local non-exported types may stay inside `index.tsx`.
- Do not mix shared type declarations with business logic.
- Do not export shared types from `index.tsx`.

Component props interface:

```ts
export interface IProps {
  title: string;
  onPress: () => void;
}
```

Use `enum` only when it improves interoperability or runtime semantics. Prefer string unions or `as const` objects for most UI variants.

---

## 7. Styles

All non-trivial components and screens must use a separate `styles.ts`.

Theme-dependent styles:

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

Rules:

- `useUiContext()` stays inside UI components.
- Theme-dependent `styles` stay inside the component through `useMemo`.
- Presenters must not receive or return colors or styles.
- Static styles may be exported as `styles` from `styles.ts`.
- Use the `const styles = StyleSheet.create(...)` then `return styles` pattern for `getStyles`.
- Do not combine a large component and its full style definition in one file.

---

## 8. Scaling

Use the project's scaling helpers consistently for layout values that should adapt to screen size.

Rules:

- Use `scaleHorizontal`, `scaleVertical`, or the project-approved scaling helpers for paddings, margins, widths, heights, positions, and similar design dimensions.
- Zero does not require scaling.
- Do not double-scale values passed to components that already scale internally.
- Before scaling a component prop such as `size`, `width`, `height`, or `radius`, inspect the target component.
- Typography scaling must follow the project's typography implementation rather than arbitrary manual scaling.

Do not force scaling onto values where React Native flex layout, percentages, or intrinsic sizing are more appropriate.

---

## 9. Event handlers

Use `on` naming, not `handle`.

Correct:

```ts
const onSubmit = async () => {};
const onPressRetry = () => {};
const onChangeText = (value: string) => {};
```

Avoid:

```ts
const handleSubmit = () => {};
const handlePress = () => {};
```

Rules:

- Do not use inline anonymous event handlers in JSX when a prepared handler can be passed.
- Parameterized wrappers belong in the presenter.
- Existing stable functions may be passed directly.

Correct:

```tsx
<Button onPress={onSubmit} />
<Input onChangeText={onChangeText} />
```

Avoid:

```tsx
<Button onPress={() => onSubmit()} />
<Input onChangeText={(value) => onChangeText(value)} />
```

A small inline callback is allowed only when required by a third-party API and extracting it would reduce clarity.

---

## 10. Render functions and list callbacks

Prefer explicit JSX and separate components.

Render callbacks are allowed when required by library APIs:

- `renderItem`;
- `renderLeftActions`;
- `renderRightActions`;
- navigation option callbacks;
- toast configuration renderers.

Rules:

- Keep render callbacks inside the UI layer.
- Do not move render callbacks into presenters.
- Do not create `renderHeader`, `renderFooter`, or `renderContent` helpers as a general decomposition pattern.
- Extract substantial UI into a component instead.

`keyExtractor` stays inside the UI component because it belongs to list rendering.

---

## 11. UI calculations

Move substantial UI data preparation into presenters or focused hooks.

Move out:

- formatted labels;
- prepared arrays;
- sorting and filtering;
- display flags based on multiple conditions;
- calculated dimensions;
- grouped data;
- complex disabled-state rules.

Allowed inside a component:

- `useMemo(() => getStyles(...), [...])`;
- small rendering-only conditions;
- `keyExtractor`;
- callbacks strictly required by the rendering API.

Do not clutter UI files with general-purpose `useMemo`, `useCallback`, `map`, `filter`, or `reduce` data preparation.

---

## 12. Animations

Reanimated and animation logic must be isolated in a presenter or dedicated hook.

Example:

```ts
export const useCardAnimation = () => {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  return {
    animatedStyle,
  };
};
```

The UI receives and applies the prepared animated style.

Minimal integration required by a library API is allowed in the component, but calculations, transitions, gesture behavior, and side effects must remain outside JSX.

---

## 13. UIKit

`src/UIKit` contains reusable visual components only.

Examples:

- `Typography`
- `Button`
- `ScreenContainer`
- `Loader`
- inputs
- cards
- modals

Each UIKit component should generally use:

```text
UIKit/
  Button/
    presenters/      # only when behavior is non-trivial
    components/      # only for subcomponents owned by this UIKit component
    index.tsx
    styles.ts
    types.ts
```

UIKit must not contain:

- requester;
- storage;
- localization resources;
- token logic;
- API clients;
- feature-specific business logic.

---

## 14. UIProvider

`src/UIProvider` owns UI configuration exposed through React Context:

- colors;
- fonts;
- spacing;
- radius;
- current language;
- supported languages;
- translation function;
- language switching;
- initialization state.

Rules:

- `UIProvider` must not contain API calls or feature business logic.
- Localization resources remain in `src/localization`.
- Storage access may be delegated to `src/libs/storage`.
- Use React state, `useMemo`, and `useCallback`.
- `useUiContext()` must throw a clear error outside the provider.
- Do not import UIProvider from infrastructure layers such as requester.

---

## 15. Libraries

### `libs/storage`

- Use one MMKV instance.
- Provide a typed wrapper.
- Do not store access or refresh tokens in MMKV.
- Tokens belong in Keychain.
- Storage errors must not crash UI.

### `libs/requester`

- Use one configured Axios instance.
- Read `API_URL` from environment configuration.
- Add locale and safe app/device headers.
- Normalize success and failure responses.
- Do not import React Context.
- Do not log out immediately on every `401`.
- Token refresh will be implemented as a dedicated auth flow.

### `libs/toast`

- Application code must use `toastService`.
- Do not import `react-native-toast-message` directly outside the toast library.
- Render `ToastHost` once near the app root.

---

## 16. Request error handling

Every user-triggered request must be awaited by the presenter or hook that owns the action.

After the request:

```ts
const response = await requester.request<ResponseType>(config);

if (response.isError) {
  toastService.showError(
    localization.t('common.error'),
    response.message || localization.t('common.somethingWentWrong'),
  );

  return;
}
```

When a request may throw unexpectedly:

```ts
try {
  const response = await requester.request<ResponseType>(config);

  if (response.isError) {
    toastService.showError(
      localization.t('common.error'),
      response.message || localization.t('common.somethingWentWrong'),
    );

    return;
  }

  // Success-only state updates.
} catch (error: unknown) {
  console.error(error);

  toastService.showError(
    localization.t('common.error'),
    localization.t('common.somethingWentWrong'),
  );
}
```

Rules:

- Do not ignore `response.isError`.
- Do not silently swallow request failures.
- Do not update success state before checking the result.
- Optimistic updates require an explicit rollback strategy.
- React Query query errors may be handled centrally or at screen level depending on UX, but user-triggered mutations must always provide visible feedback.

---

## 17. Models

Models are data structures, not business-logic containers.

Models may contain:

- fields;
- constructors or factory mapping when needed for API compatibility;
- serialization helpers only when clearly justified.

Models must not contain:

- UI handlers;
- navigation;
- API requests;
- toast calls;
- feature orchestration;
- React hooks.

Pagination append behavior belongs in a store, repository-like service, presenter, or pure helper—not in the model itself.

---

## 18. Branching

Use the clearest branching construct for the case.

- Prefer early returns and simple `if` statements.
- `switch` is allowed for clear finite-state branching, reducers, navigation states, and variant mapping.
- Do not use deeply nested conditionals.
- Prefer typed lookup maps when they are clearer than repeated conditions.

Do not ban language features without an architectural reason.

---

## 19. Imports and exports

- Use the `@` alias for imports from `src`.
- Use named exports.
- Use barrel exports carefully.
- Avoid circular dependencies.
- A barrel must not hide cross-layer dependency problems.
- Import implementation files directly when that avoids a cycle.
- UIKit exports come from `@/UIKit`.
- Infrastructure libraries are imported from their own paths, not from UIKit.

---

## 20. Temporary and showcase code

Temporary development code must:

- be isolated in a clearly named development screen or module;
- not be mixed into reusable UI components;
- not be left in production navigation unintentionally;
- be easy to remove.

Do not place request experiments, fake data generation, or debugging logic inside reusable components.

---

## 21. Tests

Prioritize focused tests for:

- pure utility functions;
- language resolution;
- requester response normalization;
- storage wrappers;
- presenters with meaningful logic;
- auth token flows when implemented.

Avoid large UI snapshots.

Tests must follow the same import and type rules as production code.

---

## 22. Quality checks

Before finishing a task, run:

```bash
npm run lint
npm test -- --runInBand
npx tsc --noEmit
```

For native infrastructure changes, also verify:

- iOS build;
- Android build;
- CocoaPods installation when iOS dependencies changed;
- no Reanimated or Worklets configuration warnings;
- no Nitro Modules linking errors.

Inspect the diff and confirm no unrelated native files or generated artifacts were changed.

---

## 23. Forbidden patterns

The following are architecture violations:

- component, styles, types, and substantial logic in one file;
- API calls inside UI components;
- business logic inside UI components;
- shared types declared in presenters or UI files;
- theme access inside presenters;
- inline request error handling scattered across JSX;
- direct MMKV access throughout the app;
- direct `react-native-toast-message` imports outside `libs/toast`;
- storing tokens in MMKV;
- immediate logout on every `401`;
- duplicate requester or storage instances;
- arbitrary render helper functions;
- large data transformations inside components;
- Reanimated calculations inside UI files;
- feature-specific logic inside UIKit;
- temporary test logic inside production components.

---

## 24. Implementation order

When implementing a new screen or component:

1. Define the folder structure.
2. Define exported types.
3. Define API/model contracts if needed.
4. Implement the presenter or focused logic hooks.
5. Implement styles in `styles.ts`.
6. Implement the clean UI in `index.tsx`.
7. Verify handlers and calculations are outside UI.
8. Verify requester errors are handled.
9. Verify there are no avoidable inline callbacks.
10. Run lint, tests, and TypeScript checks.

---

## 25. Main principles

- UI renders.
- Presenters orchestrate behavior.
- Hooks calculate reusable or derived state.
- Types describe contracts.
- Models describe data.
- Libraries provide infrastructure.
- UIProvider provides theme and localization.
- UIKit contains reusable visual components.
- Request failures produce visible feedback.
- Structure must be predictable before code is written.

## 26. File size

Try to keep files reasonably small.

Guidelines:

- UI components: preferably under 200 lines.
- Presenters: preferably under 250 lines.
- Styles: under 200 lines.
- If a file grows beyond ~300 lines, consider splitting responsibilities.
- Never split files artificially just to satisfy a number; prioritize cohesion.

## 27. One responsibility

Each file should have one primary responsibility.

If a file starts handling rendering, business logic, networking, navigation, animations, and validation at the same time, it should be split.

## 28. No local barrel files

Local barrel files are forbidden.

Do not create `index.ts` or `index.tsx` files whose only purpose is re-exporting sibling files.

### Forbidden

```ts
export { UIProvider } from './UIProvider';
export { useUIContext } from './useUIContext';
export type { UIContextValue } from './types';
```

```ts
export * from './types';
export * from './theme';
```

```ts
export { Button } from './Button';
export { Loader } from './Loader';
```

### Rules

- Component folders must not contain an `index.ts` or `index.tsx` used only as a re-export.
- Feature folders must not contain unnecessary local barrel files.
- Theme folders must not contain barrel files that only re-export sibling files.
- Localization folders must not contain barrel files that only re-export translation resources.
- Re-export chains are forbidden.
- Direct imports are preferred.
- Do not import from a directory path unless that directory intentionally exposes a public API.
- A barrel file must never re-export another barrel file.

### Allowed

A barrel file is allowed only when it represents a deliberate top-level public API.

Examples:

- `src/UIKit/index.ts`
- `src/libs/requester/index.ts`
- `src/libs/storage/index.ts`
- `src/libs/toast/index.ts`

Even these files should remain only when they:

- provide a stable public API;
- are imported throughout the application;
- hide internal implementation details;
- do not create circular dependencies;
- provide more architectural value than direct imports.

### Forbidden export chain

```text
UIKit/index.ts
    ↓
Button/index.ts
    ↓
Button.tsx
```

### Allowed export

```ts
export { Button } from './Button/Button';
export type { IProps as ButtonProps } from './Button/types';
```

### Do not create files such as

```text
src/UIProvider/index.ts
src/UIProvider/theme/index.ts
src/UIProvider/localization/index.ts

src/UIKit/Button/index.ts
src/UIKit/Typography/index.ts
src/UIKit/Loader/index.ts
src/UIKit/ScreenContainer/index.ts

src/localization/resources/index.ts
src/theme/index.ts
```

when they only re-export sibling files.

### Preferred imports

Preferred:

```ts
import { UIProvider } from '@/UIProvider/UIProvider';
import { useUIContext } from '@/UIProvider/useUIContext';

import { Button } from '@/UIKit/Button/Button';
import { Typography } from '@/UIKit/Typography/Typography';
```

Allowed only when an intentional top-level public API exists:

```ts
import { Button, Typography } from '@/UIKit';
```

Do not create intermediate re-export layers.

---

## 29. Component declaration style

All React components must be declared as **named `const` arrow functions**.

### Required

```tsx
export const Button = ({ title, onPress }: IProps) => {
  return (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
};
```

```tsx
export const LoginScreen = () => {
  return <ScreenContainer />;
};
```

```tsx
export const UIProvider = ({ children }: IProps) => {
  return <UIContext.Provider>{children}</UIContext.Provider>;
};
```

### Forbidden

```tsx
export function Button(props: IProps) {
  return <Pressable />;
}
```

```tsx
function Button(props: IProps) {
  return <Pressable />;
}
```

```tsx
export default function Button() {
  return <Pressable />;
}
```

### Hooks

Project hooks should also use `const` arrow functions.

Required:

```ts
export const useUIContext = () => {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error('useUIContext must be used inside UIProvider');
  }

  return context;
};
```

Avoid:

```ts
export function useUIContext() {
  ...
}
```

### Utility functions

Project utility functions should also prefer `const` arrow functions.

Required:

```ts
export const resolveLanguage = (locale: string): SupportedLanguage => {
  ...
};
```

Avoid:

```ts
export function resolveLanguage(locale: string) {
  ...
}
```

### Rules

- React components must use named `const` arrow functions.
- Default exports for React components are forbidden.
- `React.FC` should not be used unless there is a concrete reason.
- Hooks should use `const` arrow functions.
- Utility functions should use `const` arrow functions unless a technical limitation requires a function declaration.
- Named exports are required throughout the project.

---

## 30. Component implementation filenames

Prefer explicit implementation filenames instead of `index.tsx`.

Preferred:

```text
Button/
    Button.tsx
    styles.ts
    types.ts
```

```text
Typography/
    Typography.tsx
    styles.ts
    types.ts
```

```text
Loader/
    Loader.tsx
    styles.ts
    types.ts
```

```text
ScreenContainer/
    ScreenContainer.tsx
    styles.ts
    types.ts
```

```text
LoginScreen/
    LoginScreen.tsx
    styles.ts
    types.ts
    presenters/
        useLoginScreenPresenter.ts
```

Do not create:

```text
Button/
    Button.tsx
    index.ts
    styles.ts
    types.ts
```

when `index.ts` only re-exports `Button.tsx`.

Import directly:

```ts
import { Button } from '@/UIKit/Button/Button';
```

If the project intentionally exposes a top-level UIKit public API, this is also allowed:

```ts
import { Button } from '@/UIKit';
```

The top-level public API must export directly from implementation files, not through intermediate barrel files.