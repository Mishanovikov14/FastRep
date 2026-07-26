# UIKit

`src/UIKit` contains reusable visual components only.

Examples: Typography, Button, Loader, ScreenContainer, Input, Card, Modal.

Structure:

```text
UIKit/
  Button/
    index.tsx
    styles.ts
    types.ts
    presenters/   # only when behavior is non-trivial
```

Rules:

- Every styled component has `styles.ts`.
- Exported props are in `types.ts` and named `IProps`.
- Components are named `const` arrow functions.
- `index.tsx` contains the component implementation.
- Do not use `index.ts` or `index.tsx` as a re-export barrel.
- No API calls, storage access, token logic, requester usage, or feature logic.
- Use UIProvider values for colors, typography, spacing, and radius.
- Avoid inline handlers.
- Minimal render-only conditions are allowed.

Do not create a top-level `src/UIKit/index.ts`. Import components directly from their folders, for example `@/UIKit/Button`.
