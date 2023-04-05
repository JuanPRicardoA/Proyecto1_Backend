import {createRestaurant, getRestaurantbyId, getRestaurantbyNameorCats, putRestaurant, deleteRestaurant, enableRestaurant} from './Restaurante.controller';
import {Router} from 'express';
const router = Router();

// Endpoint POST
router.post('/', createRestaurant );

// Endpoint GET by ID
router.get('/:_id', getRestaurantbyId );

// Endpoint GET by name or categories
router.get('/', getRestaurantbyNameorCats );

// Endpoint PUT
router.put('/:_id', putRestaurant );

// Endpoint DELETE
router.delete('/:_id', deleteRestaurant );

// Endpoint PUT
router.put('/habilitar/:_id', enableRestaurant );

export default router;