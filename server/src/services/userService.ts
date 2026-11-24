import { buildFilterConditions, countUsers, findFacets, findUsers } from '../repositories/user.repository';
import { Facets, UserFilters, UserQueryParams, UsersResponse } from '../types/user.types';

export const UserService = {
  /** One page of users, pagination metadata and the facets for the same filters. */
  getUsers(params: UserQueryParams): UsersResponse {
    const conditions = buildFilterConditions(params);
    const total = countUsers(conditions);
    const totalPages = Math.ceil(total / params.limit);
    const offset = (params.page - 1) * params.limit;

    return {
      data: findUsers(conditions, params.sortField, params.sortOrder, params.limit, offset),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasMore: params.page < totalPages,
      },
      facets: findFacets(params),
    };
  },

  /** Facets only, for clients that need the sidebar without a page of users. */
  getFacets(filters: UserFilters): Facets {
    return findFacets(filters);
  },
};
