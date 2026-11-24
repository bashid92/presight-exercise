import config from '../config/env';
import { db, initializeDatabase } from './database';
import { FEMALE_FIRST_NAMES, HOBBIES, LAST_NAMES, MALE_FIRST_NAMES, NATIONALITIES } from './seedData';

const MAX_HOBBIES_PER_USER = 10;
const DEFAULT_SEED = 20251124;

/**
 * Small seeded random generator (mulberry32), so every seed run produces
 * the same directory. This keeps screenshots, tests and bug reports reproducible.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wipes users and hobbies, then inserts `userCount` users with 0–10 hobbies each. */
export function seedDatabase(userCount: number = config.seedCount, seed: number = DEFAULT_SEED): void {
  const random = createRandom(seed);
  const randomInt = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
  const pick = <T>(items: readonly T[]): T => items[randomInt(0, items.length - 1)];

  /** Partial Fisher–Yates: picks `count` distinct items. */
  const pickDistinct = <T>(items: readonly T[], count: number): T[] => {
    const copy = [...items];
    for (let i = 0; i < count; i++) {
      const j = randomInt(i, copy.length - 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  };

  initializeDatabase();

  const insertHobby = db.prepare('INSERT INTO hobbies (name) VALUES (?)');
  const insertUser = db.prepare(
    'INSERT INTO users (avatar, first_name, last_name, age, nationality) VALUES (?, ?, ?, ?, ?)',
  );
  const insertUserHobby = db.prepare('INSERT INTO user_hobbies (user_id, hobby_id) VALUES (?, ?)');

  const run = db.transaction(() => {
    db.exec(`
      DELETE FROM user_hobbies;
      DELETE FROM users;
      DELETE FROM hobbies;
      DELETE FROM sqlite_sequence WHERE name IN ('users', 'hobbies');
    `);

    const hobbyIds = HOBBIES.map((name) => Number(insertHobby.run(name).lastInsertRowid));

    for (let i = 0; i < userCount; i++) {
      const isFemale = random() < 0.5;
      const firstName = pick(isFemale ? FEMALE_FIRST_NAMES : MALE_FIRST_NAMES);
      const portrait = randomInt(0, 99);
      const avatar = `https://randomuser.me/api/portraits/${isFemale ? 'women' : 'men'}/${portrait}.jpg`;

      const userId = Number(
        insertUser.run(avatar, firstName, pick(LAST_NAMES), randomInt(18, 75), pick(NATIONALITIES)).lastInsertRowid,
      );

      for (const hobbyId of pickDistinct(hobbyIds, randomInt(0, MAX_HOBBIES_PER_USER))) {
        insertUserHobby.run(userId, hobbyId);
      }
    }
  });

  run();
}

// `npm run seed` runs this file directly.
if (require.main === module) {
  const started = Date.now();
  seedDatabase();
  console.log(`Seeded ${config.seedCount} users and ${HOBBIES.length} hobbies in ${Date.now() - started}ms.`);
}
