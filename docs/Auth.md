# Authentication

Authentication uses a short-lived access token, long-lived refresh token, token rotation, Keychain storage, and automatic refresh before forcing login.

```text
Register / Login
  ↓
Save accessToken + refreshToken in Keychain
  ↓
Attach accessToken to protected requests
  ↓
Access token expires
  ↓
POST /auth/refresh with refreshToken
  ↓
Save the new pair atomically
  ↓
Retry the original request
```

Rules:

- Refresh token is sent only to refresh/logout endpoints.
- Never attach refresh token to normal API requests.
- Replace both tokens after every successful refresh.
- Old refresh token becomes invalid after rotation.
- Do not clear the session for the first access-token `401`.
- Clear Keychain and user state only when refresh fails or the session is revoked.
- Prevent concurrent refresh storms with a single-flight mechanism.
