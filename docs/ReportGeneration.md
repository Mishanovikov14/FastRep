# Report generation

Report generation is an authenticated server-side workflow owned by `entities/report`. Screens coordinate it through focused React Query hooks and presenters; UI components never call the requester, native file APIs, or object storage directly.

## Sources and assets

A report can be generated from non-empty notes, at least one ready asset, or both. Images (`JPEG`, `PNG`, `WebP`), audio (`MP3`, `M4A`, `WAV`), and documents (`PDF`, UTF-8 text, CSV, DOCX, XLSX) are validated against the typed limits in `reportAssetLimits.ts` before upload. These checks improve feedback only; the backend remains authoritative.

Image Picker uses the iOS-compatible representation mode, which asks Photos to export HEIC/HEIF selections as JPEG-compatible assets. The normalized returned MIME type is validated and HEIC/HEIF is never sent to the backend. Audio recording uses `react-native-nitro-sound`, requests microphone permission only after the user starts recording, produces AAC audio in an M4A container, stops at 20 minutes, and removes cancelled temporary recordings.

The asset upload sequence is:

1. Request a pending asset and presigned POST from `/reports/:reportId/assets/upload-request`.
2. Send every returned form field unchanged, followed by the file body, directly to object storage with a standalone `XMLHttpRequest`. FastRep authorization headers and API base URLs are not used.
3. Confirm through `/reports/:reportId/assets/:assetId/confirm`.
4. Mark the item ready only after confirmation and invalidate the report asset query.

Local state distinguishes `LOCAL`, `REQUESTING_UPLOAD`, `UPLOADING`, `CONFIRMING`, `READY`, and `FAILED`. A storage retry reuses an unexpired upload contract, while a confirm retry reuses the existing asset ID instead of creating another pending slot.

## Generation, credits, and locking

Entitlements come from `/me/entitlements` and are UI guidance, not client-side authorization. Each new generation or explicit regeneration posts to `/reports/:reportId/generations` with a new UUID `Idempotency-Key`. A key is retained only after an uncertain network/timeout result so repeating that same HTTP operation cannot double-reserve a credit. A definitive failure clears the key.

The latest generation is fetched whenever report details opens. `QUEUED` and `PROCESSING` generations poll every two seconds through the shared Query Client; terminal states stop polling. Completion refreshes the report, output, and entitlements. Failure and cancellation refresh credits while an older successful output remains available.

Backend stages drive the visible progress text and percentage. Queued generations can be cancelled. Stable business error codes receive localized messages. `REPORT_TEMPORARILY_LOCKED` stores `lockedUntil`, shows a countdown, and prevents repeated starts until the lock expires.

## PDF output

Output metadata and a fresh presigned download URL are separate backend operations. The URL is never persisted or shown. RNFS downloads the PDF into the application cache with a filename containing environment, report ID, and generation ID. This prevents Development and Production reuse even before an environment switch clears the shared Query Client and session.

Downloads for the same PDF are single-flight, so repeated preview/share taps reuse one operation. `react-native-file-viewer` opens the local file and `react-native-share` sends the actual `application/pdf` file to the native share sheet. Cache cleanup retains only the ten newest FastRep output PDFs. Signed URLs, report contents, tokens, and file bodies are never logged.
