import z from 'zod';

export const uuid = z.string().uuid();
export const dateFromISO = z.preprocess((val) => {
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return val;
}, z.date());

export function zodKeysToSelect<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
) {
  return Object.keys(schema.shape).reduce(
    (acc, key) => {
      acc[key] = true;
      return acc;
    },
    {} as Record<string, true>,
  );
}
