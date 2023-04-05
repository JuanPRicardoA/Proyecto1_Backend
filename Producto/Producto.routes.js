import { createProduct, getProductById, getProductosByRestauranteCategoria, putProduct, deleteProduct, enableProduct } from './Producto.controller';
import { Router } from 'express';
const router = Router();

// Endpoint POST
router.post('/:_id/productos', createProduct);

// Endpoint GET
router.get('/productos/:_id', getProductById);

// Endpoint GET
router.get('/productos/get/restycat', getProductosByRestauranteCategoria);

// Endpoint PUT
router.put('/productos/:_id', putProduct);

// Endpoint DELETE
router.delete('/productos/:_id', deleteProduct);

// Endpoint PUT
router.put('/productos/habilitar/:_id', enableProduct);

export default router;