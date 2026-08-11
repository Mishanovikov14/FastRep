# Logging

All application and feature code logs through `src/libs/logger/logger.ts`.
Direct `console.*` calls are restricted to logger adapters.

## Levels

- `debug` records detailed development flow, such as picker cancellation,
  URI scheme, upload milestones, and state transitions.
- `info` records successful lifecycle milestones.
- `warn` records recoverable or expected operational failures.
- `error` records unexpected failures that require investigation.

Development builds emit all four levels. Production builds make `debug` and
`info` no-ops; `warn` and `error` pass through the production adapter. A future
monitoring integration should replace that adapter without changing screens,
presenters, entities, or services.

## Sensitive-data policy

Log only the typed metadata allowlist from `ISafeLogMetadata`. Never log:

- access or refresh tokens, authorization headers, cookies, or idempotency keys;
- presigned URLs, form fields, storage keys, request or response bodies;
- report notes, titles, file names, audio, image, document, or PDF contents;
- email addresses, user identifiers, full local paths, or full remote URLs;
- raw error/request objects that may contain any of the above.

Safe diagnostic metadata includes asset type, MIME type, byte size, duration,
URI scheme, status, progress, platform, operation, stage, and stable error code.
Event names must describe the operation without embedding runtime values.

## Release transform

`babel.config.js` enables `babel-plugin-transform-remove-console` only for the
production Babel environment. It removes direct `console.log`, `console.debug`,
and `console.info` calls and preserves `console.warn` and `console.error` for the
central production adapter. Development Babel behavior is unchanged.
