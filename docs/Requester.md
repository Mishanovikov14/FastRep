# Requester

`src/libs/requester` is the single networking infrastructure layer.

Use one configured Axios instance with base URL from environment, JSON headers, timeout, locale header, safe app/device metadata, and normalized responses.

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

Do not import React Context. Do not log out automatically on every `401`. The requester must allow access-token injection, a single refresh attempt, retrying the original request, preventing refresh storms, and clearing the session only when refresh fails.
