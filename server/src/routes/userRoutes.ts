import { Router } from 'express';
import { getFacets, getUsers } from '../controllers/user.controller';

/** Wiring only; no logic here. Express 5 forwards thrown errors to the error handler. */
const router = Router();

router.get('/facets', getFacets);
router.get('/', getUsers);

export default router;
