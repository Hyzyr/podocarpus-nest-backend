# Property photo rebuild

Every property gallery was rebuilt to: **tower hero image first, then curated unit
photos** — replacing the old broken set (HEIC that won't render in browsers, AI
placeholders, scraped stock).

## Files here

| File | Purpose |
|------|---------|
| `update-images.sql` | run on the **production** DB (keyed on real `id`, 27 properties) |
| `update-images.local.sql` | run on **local** `realestate_mvp` (keyed on building+unit, 29) — already applied |
| `prod-properties-images.json` | snapshot of prod image arrays **before** changes (rollback reference) |

## Apply on production

Images are already on the server (you copied them; the old set is kept as
`images-old`). Only the database still needs updating:

```bash
cd /home/podocarpus/apps/podocarpus/nest-app
DB=$(grep -E '^DATABASE_URL' .env | sed -E 's/^DATABASE_URL=//; s/^"//; s/"$//; s/\?.*$//')

ls uploads/properties/images/*.png | wc -l   # expect 7 (the hero images)
psql "$DB" -f update-images.sql
```

## Rollback (production)

- Files: `mv images images-new && mv images-old images`
- DB: restore the arrays from `prod-properties-images.json`

## Notes

- **Prime Residency 3 – Unit 320** has no hero (none was supplied); it uses its
  32 curated photos only.
- **6 units** with no photos of their own reuse a sibling's photos from the same
  tower: `907←1105`, `1007←1108`, `1107←1110`, `1207←1205`, `1307←1208`,
  `Marina Pinnacle 5904←5105`.
