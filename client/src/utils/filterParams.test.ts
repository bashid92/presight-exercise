import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, parseFilters, serializeFilters, toggleValue } from './filterParams';

describe('parseFilters', () => {
  it('returns defaults for an empty query string', () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it('reads every value from the short keys', () => {
    const filters = parseFilters(
      new URLSearchParams('q=ali&nat=Emirati,Indian&hob=Chess,Yoga&sort=age&order=desc'),
    );
    expect(filters).toEqual({
      search: 'ali',
      nationalities: ['Emirati', 'Indian'],
      hobbies: ['Chess', 'Yoga'],
      sortField: 'age',
      sortOrder: 'desc',
    });
  });

  it('accepts the long keys too', () => {
    const filters = parseFilters(new URLSearchParams('search=x&nationalities=A&hobbies=B&sortField=last_name&sortOrder=DESC'));
    expect(filters).toMatchObject({ search: 'x', nationalities: ['A'], hobbies: ['B'], sortField: 'last_name', sortOrder: 'desc' });
  });

  it('falls back to defaults for invalid sort values and drops blanks and duplicates', () => {
    const filters = parseFilters(new URLSearchParams('sort=password&order=sideways&hob=Chess,,Chess, '));
    expect(filters.sortField).toBe('first_name');
    expect(filters.sortOrder).toBe('asc');
    expect(filters.hobbies).toEqual(['Chess']);
  });
});

describe('serializeFilters', () => {
  it('leaves defaults out of the URL', () => {
    expect(serializeFilters(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('round-trips through parseFilters', () => {
    const state = {
      search: 'Al Sayed',
      nationalities: ['South Korean', 'New Zealander'],
      hobbies: ['3D Printing', 'Board Games'],
      sortField: 'nationality' as const,
      sortOrder: 'desc' as const,
    };
    expect(parseFilters(serializeFilters(state))).toEqual(state);
  });
});

describe('toggleValue', () => {
  it('adds a missing value and removes a present one', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b']);
  });
});
