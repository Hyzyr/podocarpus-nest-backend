# Landing Page Backend Update

Date: 2026-06-01

## Swagger

Swagger is generated from Nest decorators and is available at:

```http
GET /swagger
```

All backend routes below include the global API prefix, so frontend should call `/api/...`.

## Public Landing Endpoint

Use this as the main landing page request:

```http
GET /api/public/landing?propertiesLimit=4&eventsLimit=4&casesLimit=3
```

No auth or cookies are required. The response is cacheable with:

```http
Cache-Control: public, max-age=60, s-maxage=300
```

Limits are capped by backend at `8`.

### Response Shape

```ts
type LandingResponse = {
  stats: LandingStats;
  properties: LandingProperty[];
  events: LandingEvent[];
  successCases: LandingSuccessCase[];
};

type LandingStats = {
  yearsOperating?: number | null;
  maxLeaseTermYears?: number | null;
  totalProperties: number;
  availableProperties: number;
  averageRoi: number;
  roiMin?: number | null;
  roiMax?: number | null;
  totalInvestedValue: number;
  totalProfit: number;
  activeContracts: number;
  occupancyRate: number;
  generatedAt: string;
};

type LandingProperty = {
  id: string;
  title: string;
  description?: string | null;
  area?: string | null;
  buildingName?: string | null;
  city?: string | null;
  country?: string | null;
  contractValue: number;
  netRoiMin?: number | null;
  netRoiMax?: number | null;
  isTaxFreeZone?: boolean | null;
  isVacant: boolean;
  vacancyRisk?: string | null;
  keyBenefits?: string[];
  image?: string | null;
  statusLabel?: string | null;
  featuredRank?: number | null;
};

type LandingEvent = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  totalMembers?: number | null;
  status: 'OPEN' | 'UPCOMING';
  image: string;
  stats?: Array<{ title: string; info?: string | null }>;
};

type LandingSuccessCase = {
  id: string;
  quote: string;
  investorName: string;
  investorTitle?: string | null;
  avatarUrl?: string | null;
  totalProfit?: number | null;
  totalRoi?: number | null;
  property?: {
    id?: string | null;
    title?: string | null;
    type?: string | null;
    imageUrl?: string | null;
    year?: number | null;
    location?: {
      line1?: string | null;
      city?: string | null;
      country?: string | null;
    } | null;
  } | null;
};
```

## Optional Smaller Public Endpoints

Frontend can use these only if it intentionally wants parallel smaller requests:

```http
GET /api/public/landing/stats
GET /api/public/landing/properties?limit=4
GET /api/public/landing/events?limit=4
GET /api/public/landing/success-cases?limit=3
```

## Backend Behavior

- `stats` returns sanitized aggregate values only. It does not expose user IDs, contract IDs, tenant details, owner details, or admin-only breakdowns.
- `properties` returns enabled public properties with `ownerId=null`, ordered by `featuredRank` ascending, then newest.
- `events` returns `isActive=true` events with status `OPEN` or `UPCOMING`, sorted by nearest upcoming `startsAt`.
- `successCases` returns only records where `isPublished=true` and `hasConsent=true`.
- Public landing responses are cacheable for a short TTL.

## Admin-Controlled Fields

The backend added landing controls to existing admin property/event flows.

Properties can now be edited with:

```ts
{
  featuredRank?: number | null;
  statusLabel?: string | null;
  vacancyRisk?: 'low' | 'medium' | 'high' | null;
}
```

Events can now be edited with:

```ts
{
  subtitle?: string | null;
  stats?: Array<{ title: string; info?: string | null }>;
}
```

Landing aggregate metrics are editable separately:

```http
GET /api/admin/landing/stats
PATCH /api/admin/landing/stats
```

Send only fields the admin wants to override. Send `null` to clear an override and let backend use calculated values where supported.

Success cases are managed separately:

```http
GET /api/admin/landing/success-cases
POST /api/admin/landing/success-cases
PATCH /api/admin/landing/success-cases/:id
DELETE /api/admin/landing/success-cases/:id
```

A success case appears on the public landing page only when both `isPublished` and `hasConsent` are true.

## Frontend Implementation

Create a landing API client that calls the combined endpoint from the server-rendered home page.

```ts
export async function getLanding() {
  const response = await apiServer.get('/public/landing', {
    params: {
      propertiesLimit: 4,
      eventsLimit: 4,
      casesLimit: 3,
    },
  });

  return response.data as LandingResponse;
}
```

Recommended page usage:

```tsx
export default async function Home() {
  const landing = await LandingApi.getLanding().catch(() => null);

  return (
    <>
      <Hero />
      <Benefits stats={landing?.stats} />
      <Club />
      <CatalogSwiper properties={landing?.properties ?? []} />
      {landing?.successCases?.length ? (
        <Cases cases={landing.successCases} />
      ) : null}
      <CryptoBanner />
      <EventSlider events={landing?.events ?? []} />
    </>
  );
}
```

## Frontend Acceptance Notes

- Do not use landing JSON files as production data.
- Catalog should render up to 4 backend properties.
- Events slider should render up to 4 backend events and use `event.image`.
- Benefit cards should use backend `stats`; if stats request fails, hide numeric claims instead of showing fake values.
- Success cases should be hidden when backend returns an empty array.
- Admin panel should expose property `featuredRank`, `statusLabel`, `vacancyRisk`, event `subtitle`, event `stats`, landing stats, and success case management.
