import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { schema, migrations } from './schema';

/**
 * Web adapter. See `adapter.ts` for why the platform split is at module level.
 *
 * LokiJS is WatermelonDB's supported web backend: it persists to IndexedDB, so
 * the same schema, migrations and model classes work unchanged. The SQLite
 * adapter cannot be used here at all — its web dispatcher requires
 * `better-sqlite3`, which does not exist in a browser.
 *
 * `useWebWorker: false` keeps schema setup and migrations on the main thread.
 * That is required for the migrations in `schema.ts` (including the v1 -> v2
 * `ALTER TABLE ... DROP COLUMN` step) to apply deterministically before the
 * first query, and it avoids a worker failing to boot on a cold IndexedDB.
 */
const adapter = new LokiJSAdapter({
  dbName: 'HyperVerse',
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
});

export default adapter;