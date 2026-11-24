import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { parseUserQuery } from '../validations/userQuery.validation';

/** GET /api/users — paginated users plus top-20 facets for the active filters. */
export function getUsers(req: Request, res: Response): void {
  const params = parseUserQuery(req.query);
  res.json(UserService.getUsers(params));
}

/** GET /api/users/facets — top-20 facets only. */
export function getFacets(req: Request, res: Response): void {
  const params = parseUserQuery(req.query);
  res.json(UserService.getFacets(params));
}
