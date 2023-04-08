import Pedido from './Pedido.model';
import Restaurante from '../Restaurante/Restaurante.model';
import Usuario from '../Usuario/Usuario.model'
import Producto from '../Producto/Producto.model'

// ------------------------------------------- CRUD de pedidos ------------------------------------------------

//Crear nuevo pedido
export async function createPedido(req, res) {
    try {
        const { _id } = req.params;
        const { productos, idUsuario } = req.body;

        const restaurante = await Restaurante.findById(_id);
        if (!restaurante) return res.status(404).json({ message: 'Restaurante no encontrado.' });
        if (!restaurante.activo) return res.status(403).json({ message: 'No se puede crear el pedido, el restaurante no está activo.' });

        const usuario = await Usuario.findById(idUsuario);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado.' });
        if (usuario.rol !== 'Cliente') return res.status(403).json({ message: 'No se puede crear el pedido, el usuario no tiene rol de cliente.' });
        if (!usuario.activo) return res.status(403).json({ message: 'No se puede crear el pedido, el usuario no está activo.' });
        
        const prodsbyID = await Producto.find({idRestaurante: restaurante._id});
        const prodsRestaurante = prodsbyID.map(p => p.nombre);
        const prodsNoEncontrados = productos.filter(p => !prodsRestaurante.includes(p.nombre));

        if (prodsNoEncontrados.length > 0) {
            const nombresNoEncontrados = prodsNoEncontrados.map(p => p.nombre).join(', ');
            return res.status(400).json({ message: `Los siguientes productos no se encuentran disponibles: ${nombresNoEncontrados}` });
        }

        const newproductos = productos.map(p => {
            const { _id } = prodsbyID.find(rp => rp.nombre === p.nombre );
            return {nombre: p.nombre, _id , cantidad: p.cantidad}
        })

        const nombreRestaurante = restaurante.nombre;
        const idRestaurante = restaurante._id;
        const nombreUsuario = usuario.nombre;
        const direccion = usuario.direccion;
        const pedido = new Pedido({ nombreUsuario, idUsuario, direccion, nombreRestaurante, idRestaurante, productos: newproductos });

        restaurante.pedidos.push(pedido);
        const resultado = await pedido.save();
        await restaurante.save();
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error creando el pedido:', error.message);
        res.status(500).json({ error: 'Error al crear pedido.' });
    }
}

