import Restaurante from './Restaurante.model';
import Usuario from '../Usuario/Usuario.model';
import Pedido from '../Pedido/Pedido.model';

// -------------------------------------------- CRUD de restaurantes --------------------------------------------

//Crear nuevo restaurante
export async function createRestaurant(req, res) {
    try {
        const { nombre, direccion, telefono, categoria, idAdministrador } = req.body;

        const usuario = await Usuario.findById(idAdministrador);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
        if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede crear restaurantes.' });
        if (usuario.rol !== 'Administrador') return res.status(403).json({ message: 'No se puede crear el restaurante, el usuario no tiene rol de Administrador.' });

        const restauranteExistente = await Restaurante.findOne({ nombre });
        if (restauranteExistente) {
            return res.status(400).json({ message: 'Ya existe un restaurante con este nombre.' });
        }

        const restaurante = new Restaurante({ nombre, direccion, telefono, categoria, idAdministrador });
        const resultado = await restaurante.save();
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error creando el restaurante:', error.message);
        res.status(500).json({ error: 'Error al crear restaurante.' });
    }
}

//Retornar datos según la _id
export async function getRestaurantbyId(req, res) {
    try {

        const { idAdministrador, dia, mes, semana } = req.query;

        const restaurante = await Restaurante
            .findOne({ _id: req.params._id, activo: true })
            .populate('pedidos')
            .populate('productos');
        const productosByCat = groupBy(restaurante.productos, 'categoria')

        if (!restaurante) return res.status(404).json({ message: 'No se encontró restaurante con esa ID o está inhabilitado' });

        if (idAdministrador != null) {
            const usuario = await Usuario.findById(idAdministrador);
            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
            if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede ver los pedidos.' });
        }

        if (dia || mes || semana) {
            if (restaurante.idAdministrador.toString() === idAdministrador) {
                const pedidosRealizados = restaurante.pedidos.filter(ped => ped.estado === 'Realizado');
                let pedidosbyfecha;
                if (dia) {
                    const dia0 = new Date(dia);
                    pedidosbyfecha = pedidosRealizados.filter(ped => {
                        const fechaCreado = new Date(ped.createdAt);
                        return fechaCreado.getDate() === dia0.getDate()
                            && fechaCreado.getMonth() === dia0.getMonth()
                            && fechaCreado.getFullYear() === dia0.getFullYear()
                    });
                }
                if (mes >= 1 && mes <= 12) {
                    const mes0 = new Date(`2023-${mes}`);
                    pedidosbyfecha = pedidosRealizados.filter(ped => {
                        const fechaCreado = new Date(ped.createdAt);
                        return fechaCreado.getMonth() === mes0.getMonth()
                            && fechaCreado.getFullYear() === mes0.getFullYear()
                    });
                }
                if (semana >= 1 && semana <= 52) {
                    const dias = semana * 7;
                    const finsemana = new Date('2023-01-01');
                    finsemana.setDate(finsemana.getDate() + dias);
                    const iniciosemana = new Date(finsemana);
                    iniciosemana.setDate(iniciosemana.getDate() - 7);
                    pedidosbyfecha = pedidosRealizados.filter(ped => {
                        const fechaCreado = new Date(ped.createdAt);
                        return fechaCreado >= iniciosemana && fechaCreado <= finsemana
                    });
                }
                return res.status(200).json({
                    ...restaurante._doc,
                    pedidos: pedidosbyfecha,
                    productosByCat
                })
            }
        }

        let restauranteForAdmin
        if (restaurante.idAdministrador.toString() !== idAdministrador)
            restauranteForAdmin = { ...restaurante._doc, pedidos: [] }
        else restauranteForAdmin = {
            ...restaurante._doc,
            pedidos: restaurante.pedidos
                .filter(ped => ped.estado !== 'Creado')
                .filter(ped => ped.estado !== 'Realizado')
        }

        res.status(200).json({
            ...restauranteForAdmin,
            productosByCat
        });
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener el restaurante' });
    }
}

//Retorna datos de restaurantes  según la categoría y/o nombres que se asemejen
export async function getRestaurantbyNameorCats(req, res) {
    try {
        const { categoria, nombre } = req.query;
        const query = { activo: true };

        if (categoria) query.categoria = categoria;
        if (nombre) query.nombre = { $regex: `${nombre}`, $options: 'i' }; //${nombre} exp regular para búsqueda no estricta, $options: 'i' para que la búsqueda no tenga en cuenta si hay mayúsculas o minúsculas 

        const restaurantes = await Restaurante
            .find(query)
            .populate('pedidos')
            .populate('productos');

        const restsByPedido = restaurantes.map(rest => {
            const pedidosRealizados = rest.pedidos.filter(ped => ped.estado === 'Realizado').length
            const restaurante = { ...rest._doc, pedidos: pedidosRealizados }
            return [restaurante, pedidosRealizados]
        })

        // Posición 0: Restaurante
        // Posición 1: Cantidad de pedidos Realizados
        const restaurantesOrdenados = restsByPedido
            .sort((restA, restB) => restB[1] - restA[1])
            .map(pair => pair[0])

        if (!restaurantes.length) return res.status(404).json({ message: 'No se encontraron restaurantes con los datos proveídos' });
        res.status(200).json(restaurantesOrdenados);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

const groupBy = function (array, key) {
    return array.reduce(function (acc, actual) {
        (acc[actual[key]] = acc[actual[key]] || []).push(actual);
        return acc;
    }, {});
};

// Modificar los datos del restaurante según su _id
const catgs = ['Comida ejecutiva', 'Comida rápida', 'Comida asiática', 'Comida vegana/vegetariana', 'Comida gourmet', 'Cafetería', 'Comida de mar'];
export async function putRestaurant(req, res) {
    try {
        const { catg, idAdministrador } = req.body;
        const rest0 = await Restaurante.findById(req.params._id)
        if (!rest0.activo) return res.status(400).json({ message: 'El restaurante no está activo, no se puede modificar' });

        const usuario = await Usuario.findById(idAdministrador);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
        if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede modificar el restaurante.' });
        if (usuario.rol !== 'Administrador') return res.status(403).json({ message: 'No se puede modificar el restaurante, el usuario no tiene rol de Administrador.' });
        if (rest0.idAdministrador.toString() !== idAdministrador) return res.status(403).json({ message: 'No se puede modificar el restaurante porque el usuario no es Administrador de este restaurante' });

        if (catg && !catgs.includes(catg)) return res.status(400).json({ message: 'Categoría no válida' });

        const restaurante = await Restaurante.findByIdAndUpdate(req.params._id, req.body, { new: true });

        if (!restaurante) return res.status(404).json({ message: 'Restaurante no encontrado' });
        res.status(200).json(restaurante);
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar el restaurante' });
    }
}

// Inhabilitar un restaurante según la _id proveída
export async function deleteRestaurant(req, res) {
    try {
        const { _id } = req.params;
        const { idAdministrador } = req.body;
        const rest0 = await Restaurante.findById(_id)

        const usuario = await Usuario.findById(idAdministrador);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
        if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede inhabilitar el restaurante.' });
        if (usuario.rol !== 'Administrador') return res.status(403).json({ message: 'No se puede inhabilitar el restaurante, el usuario no tiene rol de Administrador.' });
        if (rest0.idAdministrador.toString() !== idAdministrador) return res.status(403).json({ message: 'No se puede inhabilitar el restaurante porque el usuario no es Administrador de este restaurante' });

        const restaurante = await Restaurante.findByIdAndUpdate(_id, { activo: false }, { new: true });

        if (!restaurante) return res.status(404).json({ message: 'El restaurante que se está buscando no existe.' });
        res.status(200).json({ message: 'El restaurante fue inhabilitado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al inhabilitar restaurante.' });
    }
}

// Habilitar un restaurante según la _id proveída
export async function enableRestaurant(req, res) {
    try {
        const { _id } = req.params;
        const { idAdministrador } = req.body;
        const rest0 = await Restaurante.findById(_id)

        const usuario = await Usuario.findById(idAdministrador);
        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
        if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede habilitar el restaurante.' });
        if (usuario.rol !== 'Administrador') return res.status(403).json({ message: 'No se puede habilitar el restaurante, el usuario no tiene rol de Administrador.' });
        if (rest0.idAdministrador.toString() !== idAdministrador) return res.status(403).json({ message: 'No se puede habilitar el restaurante porque el usuario no es Administrador de este restaurante' });

        const restaurante = await Restaurante.findByIdAndUpdate(_id, { activo: true }, { new: true });

        if (!restaurante) return res.status(404).json({ message: 'El restaurante que se está buscando no existe.' });
        res.status(200).json({ message: 'El restaurante fue habilitado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al habilitar restaurante.' });
    }
}