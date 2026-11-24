import { createApp } from './app';
import config from './config/env';
import { countAllUsers, initializeDatabase } from './db/database';
import { seedDatabase } from './db/seed';

initializeDatabase();

// First start (or an empty volume in Docker): create the data so the app works out of the box.
const existing = countAllUsers();
if (existing === 0) {
  console.log(`Empty database, seeding ${config.seedCount} users...`);
  seedDatabase(config.seedCount);
  console.log('Seed complete.');
} else {
  console.log(`Database ready with ${existing} users.`);
}

createApp().listen(config.port, '0.0.0.0', () => {
  console.log(`\x1b[36m[server]\x1b[0m Listening on http://localhost:${config.port} (${config.nodeEnv})`);
});
