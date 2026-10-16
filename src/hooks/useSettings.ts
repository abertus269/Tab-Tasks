import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { db } from '@/db/client';
import { setSetting } from '@/db/mutations';
import { settings } from '@/db/schema';

// Exported so the widget task handler (widget/widget-task-handler.tsx) reads
// the same key instead of duplicating the string.
export const TAP_CYCLES_STATUS_KEY = 'tapCyclesStatus';

// Off by default: a control that looks like a checkbox finishes the task on
// the first tap (PRODUCT.md principle 4). "Now" is something you start on
// purpose (long-press a task → Start), not a stop you pass through on the
// way to done. Turning this on restores the old todo → Now → done cycle.
// Shared with the widget (src/lib/widgetData.ts) so the two never disagree.
export const TAP_CYCLES_STATUS_DEFAULT = false;

export interface AppSettings {
  // On, tapping the status square walks todo -> active -> done -> todo. Off
  // (the default), a tap is a plain done/not-done toggle.
  tapCyclesStatus: boolean;
  setTapCyclesStatus: (value: boolean) => void;
}

export function useSettings(): AppSettings {
  const query = useMemo(() => db.select().from(settings), []);
  // See src/hooks/useTasks.ts's useJoinedTasks for why deps must be passed
  // explicitly — harmless here since query never changes, but consistent.
  const { data } = useLiveQuery(query, [query]);

  const tapCyclesStatus = useMemo(() => {
    const row = (data ?? []).find((r) => r.key === TAP_CYCLES_STATUS_KEY);
    return row ? row.value === 'true' : TAP_CYCLES_STATUS_DEFAULT;
  }, [data]);

  return {
    tapCyclesStatus,
    setTapCyclesStatus: (value: boolean) => setSetting(TAP_CYCLES_STATUS_KEY, value ? 'true' : 'false'),
  };
}
