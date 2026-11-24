import './setup';

import assert from 'node:assert/strict';
import { AddressInfo } from 'node:net';
import { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../src/app';
import { db } from '../src/db/database';
import { seedDatabase } from '../src/db/seed';
import { User, UsersResponse } from '../src/types/user.types';

const USER_COUNT = 600;
let server: Server;
let baseUrl: string;

async function get(path: string): Promise<{ status: number; body: any }> {
  const res = await fetch(`${baseUrl}${path}`);
  return { status: res.status, body: await res.json() };
}

async function getUsers(query: string): Promise<UsersResponse> {
  const { status, body } = await get(`/api/users?${query}`);
  assert.equal(status, 200, JSON.stringify(body));
  return body as UsersResponse;
}

/** Ground truth straight from SQLite, to compare the API against. */
function allUsers(): User[] {
  const rows = db
    .prepare(
      `SELECT u.*, (SELECT GROUP_CONCAT(h.name, '|') FROM user_hobbies uh JOIN hobbies h ON h.id = uh.hobby_id
        WHERE uh.user_id = u.id) AS list FROM users u`,
    )
    .all() as (User & { list: string | null })[];
  return rows.map((r) => ({ ...r, hobbies: r.list ? r.list.split('|') : [] }));
}

before(async () => {
  seedDatabase(USER_COUNT);
  server = createApp({ logRequests: false }).listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

describe('seed', () => {
  it('stores users with 0 to 10 hobbies', () => {
    const users = allUsers();
    assert.equal(users.length, USER_COUNT);
    assert.ok(users.every((u) => u.hobbies.length >= 0 && u.hobbies.length <= 10));
    assert.ok(users.some((u) => u.hobbies.length === 0));
    assert.ok(users.some((u) => u.hobbies.length === 10));
  });
});

describe('GET /api/users', () => {
  it('returns a page with pagination metadata', async () => {
    const res = await getUsers('limit=24');
    assert.equal(res.data.length, 24);
    assert.deepEqual(res.pagination, {
      page: 1,
      limit: 24,
      total: USER_COUNT,
      totalPages: Math.ceil(USER_COUNT / 24),
      hasMore: true,
    });
  });

  it('reports hasMore=false on the last page', async () => {
    const res = await getUsers(`limit=100&page=${Math.ceil(USER_COUNT / 100)}`);
    assert.equal(res.pagination.hasMore, false);
  });

  it('text search matches first name, last name and full name, case-insensitively', async () => {
    const sample = allUsers()[0];
    const fullName = `${sample.first_name} ${sample.last_name}`.toUpperCase();
    const res = await getUsers(`search=${encodeURIComponent(fullName)}&limit=100`);
    assert.ok(res.data.some((u) => u.id === sample.id));
    for (const u of res.data) {
      assert.ok(`${u.first_name} ${u.last_name}`.toUpperCase().includes(fullName));
    }
  });

  it('treats % and _ in the search as plain characters', async () => {
    const res = await getUsers('search=%25');
    assert.equal(res.pagination.total, 0);
  });

  it('multiple nationalities are OR', async () => {
    const res = await getUsers('nationalities=Emirati,Japanese&limit=100');
    const expected = allUsers().filter((u) => u.nationality === 'Emirati' || u.nationality === 'Japanese');
    assert.equal(res.pagination.total, expected.length);
    assert.ok(res.data.every((u) => u.nationality === 'Emirati' || u.nationality === 'Japanese'));
  });

  it('multiple hobbies are AND', async () => {
    const res = await getUsers('hobbies=Chess,Yoga&limit=100');
    const expected = allUsers().filter((u) => u.hobbies.includes('Chess') && u.hobbies.includes('Yoga'));
    assert.ok(expected.length > 0, 'seed should contain users with both hobbies');
    assert.equal(res.pagination.total, expected.length);
    assert.ok(res.data.every((u) => u.hobbies.includes('Chess') && u.hobbies.includes('Yoga')));
  });

  it('text, nationality and hobby filters apply together', async () => {
    const res = await getUsers('search=a&nat=Emirati,Indian,British&hob=Reading&limit=100');
    const expected = allUsers().filter(
      (u) =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes('a') &&
        ['Emirati', 'Indian', 'British'].includes(u.nationality) &&
        u.hobbies.includes('Reading'),
    );
    assert.equal(res.pagination.total, expected.length);
  });

  for (const sortField of ['first_name', 'last_name', 'age', 'nationality'] as const) {
    for (const sortOrder of ['asc', 'desc'] as const) {
      it(`pages through ${sortField} ${sortOrder} with no duplicate or missing users`, async () => {
        const seen: User[] = [];
        let page = 1;
        let hasMore = true;
        while (hasMore) {
          const res = await getUsers(`sortField=${sortField}&sortOrder=${sortOrder}&limit=37&page=${page}`);
          seen.push(...res.data);
          hasMore = res.pagination.hasMore;
          page += 1;
        }
        assert.equal(seen.length, USER_COUNT);
        assert.equal(new Set(seen.map((u) => u.id)).size, USER_COUNT);

        const dir = sortOrder === 'asc' ? 1 : -1;
        for (let i = 1; i < seen.length; i++) {
          const a = seen[i - 1];
          const b = seen[i];
          const va = sortField === 'age' ? a.age : String(a[sortField]).toLowerCase();
          const vb = sortField === 'age' ? b.age : String(b[sortField]).toLowerCase();
          if (va === vb) {
            assert.ok(a.id < b.id, `tie on ${sortField} must be broken by id ASC`);
          } else {
            assert.ok((va < vb ? 1 : -1) === dir, `${sortField} out of order at ${i}`);
          }
        }
      });
    }
  }

  it('rejects invalid query values with 400', async () => {
    assert.equal((await get('/api/users?sortField=password')).status, 400);
    assert.equal((await get('/api/users?sortOrder=up')).status, 400);
    assert.equal((await get('/api/users?page=0')).status, 400);
    assert.equal((await get('/api/users?limit=1000')).status, 400);
  });
});

describe('facets', () => {
  it('returns at most 20 { value, count } per facet, sorted by count', async () => {
    const { topHobbies, topNationalities } = (await getUsers('limit=1')).facets;
    for (const facet of [topHobbies, topNationalities]) {
      assert.ok(facet.length > 0 && facet.length <= 20);
      for (let i = 1; i < facet.length; i++) assert.ok(facet[i - 1].count >= facet[i].count);
    }
  });

  it('hobby counts reflect the active text and filter state', async () => {
    const nats = ['Emirati', 'Indian', 'German', 'Japanese', 'British'];
    const res = await getUsers(`search=a&nat=${nats.join(',')}&hob=Chess&limit=1`);
    const matching = allUsers().filter(
      (u) =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes('a') &&
        nats.includes(u.nationality) &&
        u.hobbies.includes('Chess'),
    );
    assert.ok(matching.length > 0, 'filter combination should match some users');
    for (const { value, count } of res.facets.topHobbies) {
      assert.equal(count, matching.filter((u) => u.hobbies.includes(value)).length, value);
    }
    assert.deepEqual(res.facets.topHobbies.find((f) => f.value === 'Chess')?.count, matching.length);
  });

  it('nationality counts reflect text and hobby filters, and keep other nationalities selectable', async () => {
    const res = await getUsers('search=e&hob=Hiking&nat=Emirati&limit=1');
    const matching = allUsers().filter(
      (u) => `${u.first_name} ${u.last_name}`.toLowerCase().includes('e') && u.hobbies.includes('Hiking'),
    );
    assert.ok(res.facets.topNationalities.length > 1);
    for (const { value, count } of res.facets.topNationalities) {
      assert.equal(count, matching.filter((u) => u.nationality === value).length, value);
    }
  });

  it('GET /api/users/facets returns the same facets as the list endpoint', async () => {
    const query = 'q=li&hob=Reading';
    const facetsOnly = await get(`/api/users/facets?${query}`);
    assert.equal(facetsOnly.status, 200);
    assert.deepEqual(facetsOnly.body, (await getUsers(query)).facets);
  });
});
