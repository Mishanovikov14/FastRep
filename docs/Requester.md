# Requester

`src/libs/requester` is the single networking infrastructure layer.

Use one configured Axios instance with base URL from environment, JSON headers, timeout, locale header, safe app/device metadata, and normalized responses.

The requester is generic and does not import modules or user token storage. `entities/user/services/tokenRefreshService.ts` configures its auth-state reader and refresh callback.

```ts
export interface IResponse<T> {
  isError: boolean;
  data?: T;
  message: string;
  status?: number;
  type?: string;
  errors?: unknown;
}
```

Normal API failures should be returned as `IResponse<T>` rather than thrown into screens.

Do not import React Context or domain storage into the requester. Do not log out automatically on every `401`. The requester must allow access-token injection, a single refresh attempt, retrying the original request, preventing refresh storms, and delegating invalid-session clearing to the user entity.

The single Axios requester receives the active API base URL from the typed runtime environment service for every
request. It is not selected through `NODE_ENV` or `react-native-config`, and the Axios interceptors, headers, timeout,
auth callbacks, refresh flow, and error normalization remain shared between environments.

- Development: `https://fastrep-api-development.up.railway.app`
- Production: `https://api.fastrep.app`

Resolving the base URL per request ensures requests started after a confirmed switch cannot retain the previous
environment's URL. Confirming a switch cancels in-flight Axios requests, pauses new requests, and stops auth-state
callbacks from exposing tokens until secure-session cleanup finishes.
