# API conventions

How this API shapes responses and reports failures. Read alongside
`/swagger` — this explains the rules, Swagger lists the endpoints.

- **Status:** implemented on `feat/error-handling-and-responses`
- **Applies to:** every route under `/api`

---

## TL;DR for frontend

| You need | Do this |
|---|---|
| Handle an error | Branch on `error.code`, never on `error.message` |
| Show a form error | Read `error.details[]` → `{ field, message }` |
| Report a bug | Quote `requestId` (also the `x-request-id` response header) |
| Paginate a list | Read `{ items, total, limit, offset, hasMore }` |
| Check an action worked | HTTP 2xx. Body is `{ success, message, updated? }` |

---

## 1. Errors

Every non-2xx response has the same body:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "UNIQUE_VIOLATION",
  "message": "That email is already taken.",
  "details": [{ "field": "email", "message": "Already in use" }],
  "path": "/api/auth/register",
  "timestamp": "2026-07-31T09:12:33.001Z",
  "requestId": "7ae9c71d-6fae-4cf1-b2a2-d43e96cb4299"
}
```

`details` appears only on validation and unique-constraint failures.

### Why branch on `code`, not `message`

`message` is prose meant for humans; it gets reworded and will eventually be
translated. `code` is part of the contract and only changes with a version bump.

```ts
// good
if (err.code === 'UNIQUE_VIOLATION') highlight('email');
// fragile
if (err.message.includes('already taken')) ...
```

### Codes

| Code | HTTP | Means |
|---|---|---|
| `VALIDATION_FAILED` | 400 | Body failed validation. See `details[]`. |
| `BAD_REQUEST` | 400 | Rejected for a reason specific to the endpoint. |
| `FOREIGN_KEY_VIOLATION` | 400 | Referenced record missing, or still referenced elsewhere. |
| `UNAUTHENTICATED` | 401 | Missing/expired token. Refresh, then retry. |
| `FORBIDDEN` | 403 | Authenticated but not allowed. |
| `ACCOUNT_DISABLED` | 403 | Account blocked. Contact support. |
| `NOT_FOUND` | 404 | No such record, **or** it isn't yours (deliberately indistinguishable). |
| `CONFLICT` | 409 | Conflicts with current state. |
| `UNIQUE_VIOLATION` | 409 | A unique field is taken. See `details[]`. |
| `RATE_LIMITED` | 429 | Too many requests. Back off. |
| `INTERNAL_ERROR` | 500 | Our bug. Report with `requestId`. |
| `SERVICE_UNAVAILABLE` | 503 | Dependency down (e.g. email). Retryable. |

> **404 vs 403:** asking for a record that exists but belongs to someone else
> returns **404**, not 403. Otherwise the status itself confirms the record
> exists, which lets a caller enumerate ids.

### Validation errors

`details` carries one entry per failed rule, with dotted paths for nested DTOs:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "3 fields failed validation.",
  "details": [
    { "field": "email", "message": "email must be an email" },
    { "field": "password", "message": "password must be longer than or equal to 6 characters" },
    { "field": "role", "message": "role must be one of the following values: investor, broker, admin, superadmin" }
  ]
}
```

### Request tracing

Send `x-request-id` and it is reused; otherwise one is generated. Either way it
comes back as a response header **and** in `requestId`, and is written to the
server log for that request.

---

## 2. Success responses

Three shapes, chosen by what the endpoint *is*. Note there is **no global
`{ data: ... }` wrapper** — it adds a level of nesting to every payload for no
benefit, and resources are returned as themselves.

### Single resource → the resource

```http
GET /api/contracts/123
```
```json
{ "id": "123", "status": "active", ... }
```

### Collection → array + paging headers

```http
GET /api/notifications?limit=20&offset=0
```
```
X-Total-Count: 120
X-Limit: 20
X-Offset: 0
```
```json
[ { "id": "...", ... } ]
```

`limit` defaults to 50 and is capped at 100.

**Why headers and not an `{ items, total }` envelope.** Existing clients spread
the response straight into an array:

```ts
const all = [...userNotifs, ...globalNotifs];
```

Wrapping the body would make that throw *"object is not iterable"* at runtime —
a hard crash, not a degraded view. Paging metadata in headers adds the totals
without changing the body's shape, so nothing has to be updated in lockstep.

`PaginatedDto` and the `paginated()` helper still exist for **new** collection
endpoints, where no client depends on the old shape. Prefer the envelope there;
use headers when retrofitting an endpoint that already ships.

### Action → `{ success, message }`

For endpoints that change state and return no resource:

```http
PATCH /api/notifications/abc/read
```
```json
{ "success": true, "message": "Notification marked as read" }
```

Bulk actions add `updated`:

```json
{ "success": true, "message": "Marked 7 notifications as read", "updated": 7 }
```

---

## 3. What changed (migration notes)

**No frontend change is required.** Each item below was checked against the
actual calls in `podocarpus-next`, and the one change that would have broken it
was reworked rather than shipped.

| # | Endpoint | Before | After | Frontend impact |
|---|---|---|---|---|
| 1 | *all* | Error shapes varied; Prisma failures surfaced as raw 500s | Uniform body with `code`, `path`, `requestId` | none — errors were never parsed for shape |
| 2 | *all* validated bodies | `message: string[]` | `message: string` + `details[]` | none — client already accepts `string \| string[]` |
| 3 | `PATCH /notifications/:id/read` | `true` / `false` (200 either way) | `{ success, message }`, **404** when not yours | none — body is discarded; 404 handled by existing try/catch |
| 4 | `PATCH /notifications/mark-all-read` | `true` | `{ success, message, updated }` | none — same reason |
| 5 | `GET /notifications` | bare array | **still a bare array**, totals moved to headers | none (see note) |
| 6 | any unique-constraint hit | 500, Prisma internals in body | 409 `UNIQUE_VIOLATION` + offending field | none — strict improvement |
| 7 | *all* | no tracing | `x-request-id` honoured and echoed | none |

> **On #5.** An `{ items, total }` envelope was built first, then reverted.
> `hooks/notifications/core/getNotifications.ts` does `[...userNotifs, ...]`,
> which throws *"object is not iterable"* on an object — a hard dashboard
> crash. Headers give the same information without touching the body.

### Optional frontend improvements

Nothing here is required; these just take advantage of what's now available.

```ts
// pagination is now possible
const res = await api.get('/notifications?limit=20&offset=0');
const total = Number(res.headers['x-total-count']);

// field-level form errors
catch (e) {
  e.response.data.details?.forEach(d => setFieldError(d.field, d.message));
}

// one request for the bell badge instead of counting client-side
const { total } = await api.get('/notifications/unread-count');
```

---

## 4. Server-side rules

For anyone adding endpoints.

**Throw Nest exceptions, not `Error`.** A raw `Error` becomes a 500 with a
generic message — correct for a genuine bug, wrong for anything a caller can
fix.

```ts
throw new NotFoundException({ code: ApiErrorCode.NOT_FOUND, message: 'Contract not found.' });
```

Passing a `code` is optional; the filter derives one from the status. Pass it
when the client needs to distinguish two failures that share a status
(`CONFLICT` vs `UNIQUE_VIOLATION`).

**Don't hand-catch Prisma errors.** `PrismaExceptionFilter` maps them centrally:

| Prisma | HTTP | Code |
|---|---|---|
| `P2002` | 409 | `UNIQUE_VIOLATION` (+ field in `details`) |
| `P2025` | 404 | `NOT_FOUND` |
| `P2003` | 400 | `FOREIGN_KEY_VIOLATION` |
| `P2014` | 400 | `FOREIGN_KEY_VIOLATION` |
| anything else | 500 | `INTERNAL_ERROR`, logged with its Prisma code |

Checking a conflict up front still gives a better message — the filter is the
safety net for races and paths nobody guarded.

**Paginate collections** with the `paginated()` helper:

```ts
const [items, total] = await Promise.all([
  this.prisma.thing.findMany({ where, take, skip: offset }),
  this.prisma.thing.count({ where }),
]);
return paginated(items, total, take, offset);
```

**Document the failures too** — `@ApiResponse({ status: 404, type: ApiErrorDto })`.
An endpoint whose errors aren't in Swagger is half-documented.

**5xx logs a stack, 4xx does not.** A 4xx is the caller's problem and would only
be noise; if you find yourself wanting a stack for one, it's probably a 500.

---

## 5. Previewing emails

**In a browser** — start the app and open:

```
http://localhost:8000/dev/emails
```

An index of every template the app sends, each viewable in light, dark, and
plaintext. Rendered by the same `renderEmail()` the mailer uses, so it cannot
drift from what actually goes out. **Dev only** — the routes are unauthenticated
and are not mounted when `NODE_ENV=production`.

**In a real inbox** — a browser is a poor stand-in for Gmail or Outlook, which
strip CSS a browser keeps:

```bash
npm run mail:test -- you@example.com            # defaults to the confirm email
npm run mail:test -- you@example.com welcome
```

Both read the same fixtures in
`src/shared/mailer/templates/preview-samples.ts`. Add an entry there when you
add an email and it appears in both automatically.

---

## 6. Where things live

| Path | What |
|---|---|
| `src/common/http/api-error.ts` | `ApiErrorCode`, error body type |
| `src/common/http/api-response.dto.ts` | `ActionResponseDto`, `PaginatedDto`, `paginated()` |
| `src/common/http/validation-exception.factory.ts` | class-validator → `details[]` |
| `src/common/filters/all-exceptions.filter.ts` | catch-all shaping |
| `src/common/filters/prisma-exception.filter.ts` | Prisma → HTTP |
| `src/main.ts` | registers filters, pipe, request id, email preview |
| `src/shared/mailer/templates/preview-samples.ts` | sample content for every email |
| `src/shared/mailer/email-preview.ts` | dev-only `/dev/emails` routes |
