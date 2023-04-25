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

        const prodsbyID = await Producto.find({ idRestaurante: restaurante._id, activo: true });
        const prodsRestaurante = prodsbyID.map(p => p.nombre);
        const prodsNoEncontrados = productos.filter(p => !prodsRestaurante.includes(p.nombre));

        if (prodsNoEncontrados.length > 0) {
            const nombresNoEncontrados = prodsNoEncontrados.map(p => p.nombre).join(', ');
            return res.status(400).json({ message: `Los siguientes productos no se encuentran disponibles: ${nombresNoEncontrados}` });
        }

        let valorTotal = 0;
        const newproductos = productos.map(p => {
            const { _id, precio } = prodsbyID.find(rp => rp.nombre === p.nombre);
            const valorProducto = p.cantidad * precio;
            valorTotal += valorProducto;
            return { nombre: p.nombre, _id, cantidad: p.cantidad }
        })

        const idRestaurante = restaurante._id;
        const direccion = usuario.direccion;
        const distanceRestClient = `${Math.floor(Math.random() * 1000) + 1} metros`
        const pedido = new Pedido({ idUsuario, direccion, idRestaurante, productos: newproductos, valorTotal, distanceRestClient });

        restaurante.pedidos.push(pedido);
        const resultado = await pedido.save();
        await restaurante.save();
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error creando el pedido:', error.message);
        res.status(500).json({ error: 'Error al crear pedido.' });
    }
}

//Retornar datos de pedidos según la _id
export async function getPedidoById(req, res) {
    try {
        const pedido = await Pedido.findOne({ _id: req.params._id, activo: true });
        const restaurante = await Restaurante.findById(pedido.idRestaurante);

        if (!pedido) return res.status(404).json({ message: 'No se encontró pedido con esa ID o está inhabilitado.' });

        if (!restaurante.activo) return res.status(403).json({ message: 'No se puede encontrar el pedido, el restaurante no está activo.' });

        res.status(200).json(pedido);
    } catch (error) {
        console.error('Error al obtener el pedido:', error.message);
        res.status(500).json({ error: 'Error al obtener el pedido.' });
    }
}

//Retorna datos de pedidos REALIZADOS por un usuario (domiciliario), ENVÍADOS por un usuario (cliente)
//PEDIDO a un restaurante y/o entre las fechas dadas
//Formato fechaInicio, fechaFin: DD/MM/AAAA hh:mm:ss
export async function getPedidos(req, res) {
    try {
        const { idUsuario, idDomiciliario, idRestaurante, fechaInicio, fechaFin, estado } = req.query;
        const query = { activo: true };

        const fechaI = fechaInicio ? new Date(fechaInicio.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6Z')) : null;
        const fechaF = fechaFin ? new Date(fechaFin.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6Z')) : null;

        if (idUsuario && estado) {
            query.idUsuario = idUsuario;
            query.estado = "Enviado";
            const cliente = await Usuario.findById(idUsuario);
            if (!cliente.activo) return res.status(403).json({ message: 'No se pueden obtener pedidos, el usuario no está activo' });
        } else if (idDomiciliario && estado) {
            query.idDomiciliario = idDomiciliario;
            query.estado = "Realizado";
            const domiciliario = await Usuario.findById(idDomiciliario);
            if (!domiciliario.activo) return res.status(403).json({ message: 'No se pueden obtener pedidos, el usuario no está activo' });
        } else if (idRestaurante) {
            query.idRestaurante = idRestaurante;
            const restaurante = await Restaurante.findById(idRestaurante);
            if (!restaurante.activo) return res.status(403).json({ message: 'No se pueden obtener pedidos, el restaurante no está activo.' });
        } else if (fechaI && fechaF) {
            query.createdAt = { $gte: fechaI, $lte: fechaF }; //$gte (mayor o igual que) y $lte (menor o igual que)
        } else if (fechaI) {
            query.createdAt = { $gte: fechaI };
        } else if (fechaF) {
            query.createdAt = { $lte: fechaF };
        } else {
            return res.status(404).json({ message: 'No hay suficientes parámetros para buscar.' });
        }

        const pedidos = await Pedido.find(query);
        pedidos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        if (!pedidos.length) return res.status(404).json({ message: 'No se encontraron pedidos con los datos proveídos.' });
        res.status(200).json(pedidos);
    } catch (error) {
        console.error('Error al obtener los pedidos:', error.message);
        res.status(500).json({ error: 'Error al obtener los pedidos.' });
    }
}

//Retornar datos de los pedidos enviados, pero sin aceptar
export async function getPedidosEnviados(req, res) {
    try {
        const { filtro } = req.query;

        const distanceRestClientRegex = /(\d+) metros/;
        const pedidosEnviados = await Pedido.find({ estado: 'Enviado', activo: true });
        if (!pedidosEnviados.length) {
            return res.status(404).json({ message: 'No se encontraron pedidos enviados.' });
        }

        if (filtro === 'Vejez') pedidosEnviados.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (filtro === 'distanceRestClient') {
            pedidosEnviados.sort((a, b) => {
                const aDistance = parseInt(a.distanceRestClient.match(distanceRestClientRegex)[1]);
                const bDistance = parseInt(b.distanceRestClient.match(distanceRestClientRegex)[1]);
                return aDistance - bDistance;
            });
        }
        if (filtro === 'distanceRestDeliv') {
            pedidosEnviados.forEach(pedido => {
                const distanceRestDeliv = `${Math.floor(Math.random() * 1000) + 1} metros`
                Object.assign(pedido, { distanceRestDeliv });
            });
            pedidosEnviados.sort((a, b) => {
                const aDistance = parseInt(a.distanceRestDeliv.match(distanceRestClientRegex)[1]);
                const bDistance = parseInt(b.distanceRestDeliv.match(distanceRestClientRegex)[1]);
                return aDistance - bDistance;
            })
        }
        res.status(200).json(pedidosEnviados);
    } catch (error) {
        console.error('Error al obtener los pedidos enviados:', error.message);
        res.status(500).json({ error: 'Error al obtener los pedidos enviados.' });
    }
}

//Modificar los datos del pedido según su _id, a menos que este ya haya sido enviado.
export async function putPedido(req, res) {
    try {
        const { idUsuario, productos } = req.body;

        const pedido = await Pedido.findById(req.params._id);
        if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' })
        if (!pedido.activo) return res.status(400).json({ message: 'El pedido no está activo, no puede modificar.' });
        if (pedido.estado !== 'Creado') return res.status(403).json({ message: 'No se puede modificar el pedido, ya se envió.' });

        const usuario = await Usuario.findById(idUsuario);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
        if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede modificar el pedido.' });
        if (usuario.rol !== 'Cliente') return res.status(403).json({ message: 'No se puede modificar el pedido, el usuario no tiene rol de Cliente.' });
        if (pedido.idUsuario.toString() !== idUsuario) return res.status(403).json({ message: 'No se puede modificar el pedido porque el usuario no es el dueño del mismo.' });

        const restaurante = await Restaurante.findById(pedido.idRestaurante);
        if (!restaurante.activo) return res.status(400).json({ message: 'El restaurante no está activo, no se puede modificar el pedido.' });

        const prodsbyID = await Producto.find({ idRestaurante: restaurante._id });
        const prodsRestaurante = prodsbyID.map(p => p.nombre);
        const prodsNoEncontrados = productos.filter(p => !prodsRestaurante.includes(p.nombre));

        if (prodsNoEncontrados.length > 0) {
            const nombresNoEncontrados = prodsNoEncontrados.map(p => p.nombre).join(', ');
            return res.status(400).json({ message: `Los siguientes productos no se encuentran disponibles: ${nombresNoEncontrados}` });
        }

        let valorTotal = 0;
        const newproductos = productos.map(p => {
            const { _id, precio } = prodsbyID.find(rp => rp.nombre === p.nombre);
            const valorProducto = p.cantidad * precio;
            valorTotal += valorProducto;
            return { nombre: p.nombre, _id, cantidad: p.cantidad }
        })
        const pedidoUpdated = await Pedido.findByIdAndUpdate(req.params._id, {
            ...req.body,
            productos: newproductos,
            valorTotal
        }, { new: true });

        res.status(200).json(pedidoUpdated);
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar el pedido.' });
    }
}

// Inhabilitar un pedido según la _id proveída
export async function deletePedido(req, res) {
    try {
        const { _id } = req.params;
        const { idUsuario } = req.body;

        const pedido = await Pedido.findById(_id);
        if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' })
        if (!pedido.activo) return res.status(400).json({ message: 'El pedido no está activo, no se puede modificar.' });

        const usuario = await Usuario.findById(idUsuario);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
        if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede inhabilitar el pedido.' });
        if (usuario.rol !== 'Cliente') return res.status(403).json({ message: 'No se puede inhabilitar el pedido, el usuario no tiene rol de Cliente.' });
        if (pedido.idUsuario.toString() !== idUsuario) return res.status(403).json({ message: 'No se puede inhabilitar el pedido porque el usuario no es el dueño del mismo.' });

        pedido.activo = false;
        await pedido.save();

        const restaurante = await Restaurante.findById(pedido.idRestaurante);
        if (!restaurante.activo) return res.status(400).json({ message: 'El restaurante no está activo, no se puede modificar el pedido.' });

        restaurante.pedidos = restaurante.pedidos.filter(pedidoID => pedidoID.toString() !== _id);
        await restaurante.save();

        res.status(200).json({ message: 'El pedido fue inhabilitado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al inhabilitar el pedido.' });
    }
}

// Habilitar un pedido según la _id proveída
export async function enablePedido(req, res) {
    try {
        const { _id } = req.params;
        const { idUsuario } = req.body;

        const pedido = await Pedido.findById(_id);
        if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' })

        const usuario = await Usuario.findById(idUsuario);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
        if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede habilitar el pedido.' });
        if (usuario.rol !== 'Cliente') return res.status(403).json({ message: 'No se puede habilitar el pedido, el usuario no tiene rol de Cliente.' });
        if (pedido.idUsuario.toString() !== idUsuario) return res.status(403).json({ message: 'No se puede habilitar el pedido porque el usuario no es el dueño del mismo.' });

        pedido.activo = true;
        await pedido.save();

        const restaurante = await Restaurante.findById(pedido.idRestaurante);
        if (!restaurante.activo) return res.status(400).json({ message: 'El restaurante no está activo, no se puede modificar el pedido.' });

        restaurante.pedidos.push(pedido);
        await restaurante.save();

        res.status(200).json({ message: 'El pedido fue habilitado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al habilitar el pedido.' });
    }
}

//Cambios de estado de pedidos
export async function putStateChanges(req, res) {
    try {
        const { idUsuario, estado } = req.body;

        const pedido = await Pedido.findById(req.params._id);
        if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' })
        if (!pedido.activo) return res.status(400).json({ message: 'El pedido no está activo, no puede modificar.' });

        const usuario = await Usuario.findById(idUsuario);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
        if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede modificar el pedido.' });

        const restaurante = await Restaurante.findById(pedido.idRestaurante);
        if (!restaurante.activo) return res.status(400).json({ message: 'El restaurante no está activo, no se puede modificar el pedido.' });

        if (usuario.rol === 'Cliente') {
            if (pedido.idUsuario.toString() !== idUsuario) return res.status(403).json({ message: 'No se puede modificar el pedido porque el usuario no es el dueño del mismo.' });
            if (pedido.estado === 'Creado' && estado === 'Enviado') {
                pedido.estado = estado;
                console.log('Pedido enviado')
            }
        } else if (usuario.rol === 'Domiciliario') {
            if (pedido.estado === 'Enviado' && estado === 'Aceptado') {
                pedido.idDomiciliario = idUsuario;
                pedido.estado = estado;
                console.log('Pedido aceptado')
            } else if (
                pedido.estado === 'Recibido' &&
                estado === 'En dirección' &&
                pedido.idDomiciliario === idUsuario
            ) {
                pedido.estado = estado;
                console.log('Pedido en dirección')
            } else if (
                pedido.estado === 'En dirección' &&
                estado === 'Realizado' &&
                pedido.idDomiciliario === idUsuario
            ) {
                pedido.estado = estado;
                console.log('Pedido realizado')
            }
        } else if (usuario.rol === 'Administrador') {
            if (restaurante.idAdministrador.toString() !== idUsuario) return res.status(403).json({ message: 'No se puede modificar el pedido porque el usuario no es el Administrador del restaurante.' });
            if (pedido.estado === 'Aceptado' && estado === 'Recibido') {
                pedido.estado = estado;
                console.log('Pedido recibido')
            }
        }
        await pedido.save();
        res.status(200).json(pedido);
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar el pedido.' });
    }
}