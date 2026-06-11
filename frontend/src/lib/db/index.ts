import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import { schema } from './schema';
import Session from './models/Session';
import Transcript from './models/Transcript';

const adapter = new LokiJSAdapter({
  schema,
  // (You might want to configure migrations here for production)
  useWebWorker: false,
  useIncrementalIndexedDB: true,
});

export const database = new Database({
  adapter,
  modelClasses: [
    Session,
    Transcript,
  ],
});
