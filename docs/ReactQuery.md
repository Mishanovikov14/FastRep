# React Query

Use TanStack React Query for server state.

- Define stable query keys.
- Keep query and mutation hooks inside modules or focused hooks.
- Do not mirror server state into Zustand without a clear reason.
- Invalidate or update relevant queries after mutations.
- User-triggered mutations must show visible error feedback.
- Avoid retry loops for authorization failures.
- Query functions use the shared requester.
- Keep UI free from raw networking logic.
