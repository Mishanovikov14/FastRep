# Animations

Reanimated and gesture logic belongs in presenters or dedicated hooks.

Move shared values, animated styles, gesture calculations, transitions, and animation side effects out of UI files. UI components receive prepared animated styles and handlers.

Minimal integration required by a third-party API is allowed. Do not double-scale component props. Do not place Reanimated calculations directly inside JSX.
