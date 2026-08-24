import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { asc } from 'drizzle-orm';

import { db } from '@/db/client';
import { categories } from '@/db/schema';
import type { CategoryRecord } from '@/lib/types';

export function useCategories(): CategoryRecord[] {
  const { data } = useLiveQuery(db.select().from(categories).orderBy(asc(categories.name)));
  return data ?? [];
}
