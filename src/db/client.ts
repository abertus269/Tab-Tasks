import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

import * as schema from './schema';

const DB_NAME = 'tabtasks.db';
// enableChangeListener is required for useLiveQuery to receive write notifications.
const DB_OPTIONS = { enableChangeListener: true };

export let expoDb: SQLiteDatabase;
export let db: ReturnType<typeof drizzle<typeof schema>>;

// expo-sqlite's web implementation runs SQLite in a Worker and bridges
// openDatabaseSync through a main-thread busy-wait on SharedArrayBuffer;
// that busy-wait can time out before the worker finishes compiling the wa-sqlite
// WASM binary, so web opens asynchronously instead. Native's JSI binding is
// truly synchronous and doesn't hit this. Callers must await `dbReady` (see
// src/app/_layout.tsx) before touching `db`.
export const dbReady: Promise<void> = (async () => {
  const database =
    Platform.OS === 'web'
      ? await openDatabaseAsync(DB_NAME, DB_OPTIONS)
      : openDatabaseSync(DB_NAME, DB_OPTIONS);
  expoDb = database;
  db = drizzle(expoDb, { schema });

  // SQLite defaults foreign key enforcement to OFF. Without this, deleting a
  // category leaves orphaned category_id values instead of nulling them via
  // the schema's onDelete: 'set null'.
  if (Platform.OS === 'web') {
    await database.execAsync('PRAGMA foreign_keys = ON;');
  } else {
    database.execSync('PRAGMA foreign_keys = ON;');
  }
})();
