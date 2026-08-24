import { randomUUID } from 'expo-crypto';

import { categoryColors } from '@/theme/tokens';

import { db } from './client';
import { categories } from './schema';

const DEFAULT_CATEGORIES = [
  { name: 'Personal', color: categoryColors[0], icon: 'user' },
  { name: 'Studies', color: categoryColors[2], icon: 'graduation-cap' },
  { name: 'Work', color: categoryColors[4], icon: 'briefcase' },
] as const;

// "Uncategorized" is not a seeded row — it's categoryId IS NULL rendered as a
// neutral chip, which avoids a magic row a user could rename or delete.
export function seedIfEmpty(): void {
  const existing = db.select({ id: categories.id }).from(categories).limit(1).all();
  if (existing.length > 0) return;

  db.insert(categories)
    .values(
      DEFAULT_CATEGORIES.map((c) => ({
        id: randomUUID(),
        name: c.name,
        color: c.color,
        icon: c.icon,
      })),
    )
    .run();
}
