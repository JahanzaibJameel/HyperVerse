import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { schema, migrations } from './schema';

/**
 * Native adapter.
 *
 * This module and `adapter.web.ts` are the two implementations, selected by
 * Metro's platform-extension resolution: web resolves `./adapter` to
 * `adapter.web.ts`, iOS and Android resolve it to this file. The split has to
 * happen at the *module* level, not behind a `Platform.OS` check inside one
 * file — Metro resolves and bundles every statically reachable module
 * regardless of which branch runs at runtime, so a single file importing both
 * adapters would still drag the SQLite path into the web bundle and still fail
 * to resolve `better-sqlite3`.
 *
 * `@nozbe/watermelondb/adapters/sqlite` has no web implementation. Its
 * `makeDispatcher/index.js` (the non-native variant Metro picks on web)
 * unconditionally requires `../sqlite-node/DatabaseBridge`, which requires
 * `better-sqlite3` — a Node-only native module that is not and should not be a
 * dependency of this project. Only `makeDispatcher/index.native.js` avoids it.
 *
 * Tests keep working unchanged: `jest.setup.js` mocks
 * `@nozbe/watermelondb/adapters/sqlite` with a LokiJS-backed class, and this
 * file still imports that specifier.
 */
const adapter = new SQLiteAdapter({
  dbName: 'HyperVerse',
  schema,
  migrations,
  // Run the database in synchronous mode for better performance.
  // Native only — the LokiJS adapter has no JSI mode.
  jsi: true,
});

export default adapter;