import { createUser, getUser, putUser, deleteUser, enableUser } from './Usuario.controller';
import { Router } from 'express';
const router = Router();

// Endpoint POST
router.post('/', createUser);

// Endpoint GET
router.get('/', getUser);

// Endpoint PUT
router.put('/:_id', putUser);

// Endpoint DELETE
router.delete('/:_id', deleteUser);

// Endpoint PUT
router.put('/habilitar/:_id', enableUser);

export default router;