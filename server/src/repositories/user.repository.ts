import db from '../db/database';
import {
  FacetCount,
  Facets,
  FilterConditions,
  SortField,
  SortOrder,
  User,
  UserFilters,
} from '../types/user.types';

const FACET_LIMIT = 20;
const HOBBY_SEPARATOR = '|||';

interface UserRow {
  id: number;
  avatar: string;
  first_name: string;
  last_name: string;
  age: number;
  nationality: string;
  hobbies_list: string | null;
}

/** Escapes LIKE wildcards so a search for "50%" or "a_b" matches literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Builds the WHERE clause shared by the user list, the total count and the facets.
 * This is the only place filtering SQL lives.
 *
 * - search: case-insensitive match on first name, last name or "first last"
 * - nationalities: OR (user is any of the selected nationalities)
 * - hobbies: AND (user has every selected hobby)
 */
export function buildFilterConditions(filters: UserFilters): FilterConditions {
  const clauses: string[] = ['1=1'];
  const params: (string | number)[] = [];

  if (filters.search) {
    const term = `%${escapeLike(filters.search)}%`;
    clauses.push(`(
      u.first_name LIKE ? ESCAPE '\\'
      OR u.last_name LIKE ? ESCAPE '\\'
      OR (u.first_name || ' ' || u.last_name) LIKE ? ESCAPE '\\'
    )`);
    params.push(term, term, term);
  }

  if (filters.nationalities.length > 0) {
    clauses.push(`u.nationality IN (${filters.nationalities.map(() => '?').join(', ')})`);
    params.push(...filters.nationalities);
  }

  if (filters.hobbies.length > 0) {
    // hobbies.name is COLLATE NOCASE, so IN matches case-insensitively.
    clauses.push(`u.id IN (
      SELECT uh.user_id
      FROM user_hobbies uh
      JOIN hobbies h ON h.id = uh.hobby_id
      WHERE h.name IN (${filters.hobbies.map(() => '?').join(', ')})
      GROUP BY uh.user_id
      HAVING COUNT(DISTINCT uh.hobby_id) = ?
    )`);
    params.push(...filters.hobbies, filters.hobbies.length);
  }

  return { whereClause: clauses.join(' AND '), params };
}

export function countUsers(conditions: FilterConditions): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS total FROM users u WHERE ${conditions.whereClause}`)
    .get(...conditions.params) as { total: number };
  return row.total;
}

/**
 * Returns one page of users. `id` is always the last sort key, so rows with
 * equal values keep a fixed order and offset pagination never skips or repeats a user.
 * `sortField` is whitelisted by validation before it reaches this string.
 */
export function findUsers(
  conditions: FilterConditions,
  sortField: SortField,
  sortOrder: SortOrder,
  limit: number,
  offset: number,
): User[] {
  const direction = sortOrder === 'desc' ? 'DESC' : 'ASC';
  const collate = sortField === 'age' ? '' : ' COLLATE NOCASE';

  const rows = db
    .prepare(
      `SELECT
        u.id, u.avatar, u.first_name, u.last_name, u.age, u.nationality,
        (
          SELECT GROUP_CONCAT(name, '${HOBBY_SEPARATOR}')
          FROM (
            SELECT h.name
            FROM user_hobbies uh
            JOIN hobbies h ON h.id = uh.hobby_id
            WHERE uh.user_id = u.id
            ORDER BY h.name
          )
        ) AS hobbies_list
      FROM users u
      WHERE ${conditions.whereClause}
      ORDER BY u.${sortField}${collate} ${direction}, u.id ASC
      LIMIT ? OFFSET ?`,
    )
    .all(...conditions.params, limit, offset) as UserRow[];

  return rows.map(toUser);
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    avatar: row.avatar,
    first_name: row.first_name,
    last_name: row.last_name,
    age: row.age,
    nationality: row.nationality,
    hobbies: row.hobbies_list ? row.hobbies_list.split(HOBBY_SEPARATOR) : [],
  };
}

/**
 * Top 20 hobbies and nationalities for the active text filter and filter state.
 *
 * Hobby counts apply every active filter.
 * Nationality counts apply the text and hobby filters but not the nationality
 * selection itself. Nationalities are OR'ed, so the list has to keep showing the
 * other nationalities and how many users each would add; otherwise picking one
 * nationality would hide every other choice. This is the usual
 * "disjunctive facet" behaviour of search UIs.
 */
export function findFacets(filters: UserFilters): Facets {
  const all = buildFilterConditions(filters);
  const withoutNationality = buildFilterConditions({ ...filters, nationalities: [] });

  const topHobbies = db
    .prepare(
      `SELECT h.name AS value, COUNT(*) AS count
      FROM user_hobbies uh
      JOIN hobbies h ON h.id = uh.hobby_id
      JOIN users u ON u.id = uh.user_id
      WHERE ${all.whereClause}
      GROUP BY h.id
      ORDER BY count DESC, h.name ASC
      LIMIT ${FACET_LIMIT}`,
    )
    .all(...all.params) as FacetCount[];

  const topNationalities = db
    .prepare(
      `SELECT u.nationality AS value, COUNT(*) AS count
      FROM users u
      WHERE ${withoutNationality.whereClause}
      GROUP BY u.nationality
      ORDER BY count DESC, u.nationality ASC
      LIMIT ${FACET_LIMIT}`,
    )
    .all(...withoutNationality.params) as FacetCount[];

  return { topHobbies, topNationalities };
}
