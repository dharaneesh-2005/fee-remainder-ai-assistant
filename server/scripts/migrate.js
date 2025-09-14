import { ensureDb } from '../src/db.js';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    await ensureDb();
    console.log('Migration complete.');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  }
})();
