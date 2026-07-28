# UIKit

`AGENTS.md` is authoritative. `src/UIKit` contains only globally reusable
visual components expected to be used across independent modules.

Examples: Typography, Button, Input, Header, Loader, ScreenContainer,
EmptyState, CustomAlert, Card, Modal.

Structure:

```text
UIKit/
  Button/
    index.tsx
    styles.ts
    presenters/   # only when behavior is non-trivial
```

Rules:

- Every styled component has `styles.ts`.
- Component-local props are named `IProps` and declared in `index.tsx`.
- Do not create `types.ts` only for `IProps`; use it only for shared exported
  contracts consumed by more than one file.
- Components are named `const` arrow functions.
- `index.tsx` contains the component implementation.
- Do not use `index.ts` or `index.tsx` as a re-export barrel.
- No API calls, storage access, token logic, requester usage, or feature logic.
- Use UIProvider values for colors, typography, spacing, and radius.
- Avoid inline handlers.
- Minimal render-only conditions are allowed.

UIKit must not contain domain-specific, report-specific, or screen-specific
components; entity dependencies; business logic; or a generic icon registry.
A component reusable only within one module stays in that module.

Do not create a top-level `src/UIKit/index.ts`. Import components directly from their folders, for example `@/UIKit/Button`.

## Icons

Icons do not belong in UIKit. Each icon is a separate named React component:

```text
src/assets/icons/
  ArrowBackIcon.tsx
  ProfileIcon.tsx
  ReportsIcon.tsx
  CrossIcon.tsx
```

Each file uses `react-native-svg` and exposes explicit `width`, `height`, and
`color` props where appropriate.

Good:

```tsx
import { ArrowBackIcon } from '@/assets/icons/ArrowBackIcon';
```

Bad:

```tsx
<Icon name="arrow-back" />
```

Do not create a generic UIKit `Icon`, a `switch(name)` registry, or an
icon-name string union. Do not copy the same SVG path into multiple files.
UIKit and feature modules may import individual icons directly from assets.
