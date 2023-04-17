import { createPedido, getPedidoById, getPedidos, getPedidosEnviados, putPedido, deletePedido, enablePedido, putStateChanges } from './Pedido.controller';
import { Router } from 'express';
const router = Router();

// Endpoint POST
router.post('/:_id/pedidos', createPedido);

// Endpoint GET
router.get('/pedidos/:_id', getPedidoById);

// Endpoint GET
router.get('/pedidos/get/filtrosped', getPedidos);

//Endpoint GET
router.get('/pedidos/get/enviados', getPedidosEnviados);

// Endpoint PUT
router.put('/pedidos/:_id', putPedido);

// Endpoint DELETE
router.delete('/pedidos/:_id', deletePedido);

// Endpoint PUT
router.put('/pedidos/habilitar/:_id', enablePedido);

// Endpoint PUT
router.put('/pedidos/estado/:_id', putStateChanges)

export default router;