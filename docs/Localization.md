# Localization

Supported languages: `en`, `fr`, `es`, `uk`, `de`.

- English is the fallback.
- Resources are TypeScript objects under `src/localization/resources`.
- Resource structures must match.
- On first start, resolve the first supported device language; otherwise use English.
- Persist the selected language in MMKV.
- On later starts, saved language wins.
- Device language changes must not overwrite an existing user choice.
- Requester reads language from the non-React localization service, not UIProvider.
- Do not duplicate language resolution logic.
