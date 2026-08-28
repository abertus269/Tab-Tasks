import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { db } from '@/db/client';
import { setSetting } from '@/db/mutations';
import { settings } from '@/db/schema';

const TAP_CYCLES_STATUS_KEY = 'tapCyclesStatus';

export interface AppSettings {
  // Tapping a row walks todo -> active -> done -> todo. Off, a tap is a plain
  // done/not-done toggle. Defaults to on: the whole point of the setting is
  // to let a user opt back OUT of the new cycling behavior.
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
    return row ? row.value === 'true' : true;
  }, [data]);

  return {
    tapCyclesStatus,
    setTapCyclesStatus: (value: boolean) => setSetting(TAP_CYCLES_STATUS_KEY, value ? 'true' : 'false'),
  };
}
