import Producto from './Producto.model';
import Restaurante from '../Restaurante/Restaurante.model';
import Usuario from '../Usuario/Usuario.model'

// -------------------------------------- CRUD de productos ------------------------------------------------

//Crear nuevo producto
export async function createProduct(req, res) {
    try {
        const { _id } = req.params;
        const { nombre, descripcion, precio, categoria, idAdministrador } = req.body;
        const usuario = await Usuario.findById(idAdministrador);

        if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })
        if (!usuario.activo) return res.status(400).json({ message: 'El usuario no está activo, no puede crear restaurantes.' });
        if (usuario.rol !== 'Administrador') return res.status(403).json({ message: 'No se puede crear el restaurante, el usuario no tiene rol de Administrador.' });

        const restaurante = await Restaurante.findById(_id);
        if (!restaurante) return res.status(404).json({ message: 'Restaurante no encontrado.' });

        if (!restaurante.activo) return res.status(403).json({ message: 'No se puede crear el producto, el restaurante no está activo.' });

        const nombreRestaurante = restaurante.nombre;
        const idRestaurante = restaurante._id;
        const producto = new Producto({ nombre, descripcion, precio, categoria, nombreRestaurante, idRestaurante });

        const catexiste = restaurante.categorias.find(cat => cat === categoria);
        if (!catexiste) {
            restaurante.categorias.push(categoria);
            await restaurante.save();
        }

        const prodsbyID = await Producto.find({idRestaurante: idRestaurante});
        const prodexiste = prodsbyID.find(prod => prod.nombre === nombre)

        if (!prodexiste) {
            restaurante.productos.push(producto);
            await restaurante.save();
        } else {
            return res.status(403).json({ message: 'No se puede crear el producto porque ya existe.' })
        }

        const resultado = await producto.save();
        await restaurante.save();
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error creando el producto:', error.message);
        res.status(500).json({ error: 'Error al crear producto.' });
    }
}

//Retornar datos según la _id
export async function getProductById(req, res) {
    try {
        const producto = await Producto.findOne({ _id: req.params._id, activo: true });
        const restaurante = await Restaurante.findById(producto.idRestaurante);

        if (!producto) return res.status(404).json({ message: 'No se encontró producto con esa ID o está inhabilitado.' });

        if (!restaurante.activo) return res.status(403).json({ message: 'No se puede crear el producto, el restaurante no está activo.' });

        res.status(200).json(producto);
    } catch (error) {
        console.error('Error al obtener el producto:', error.message);
        res.status(500).json({ error: 'Error al obtener el producto.' });
    }
}

//Retorna datos de productos según la categoría y/o restaurante
export async function getProductosByRestauranteCategoria(req, res) {
    try {
        const { nombreRestaurante, categoria } = req.query;
        const query = { activo: true };

        if (categoria) query.categoria = categoria;
        if (nombreRestaurante) {
            query.nombreRestaurante = nombreRestaurante;
            const restaurante = await Restaurante.findOne({ nombre: nombreRestaurante });
            if (!restaurante.activo) return res.status(403).json({ message: 'No se puede obtener productos, el restaurante no está activo.' });
        }

        const productos = await Producto.find(query);

        if (!productos.length) return res.status(404).json({ message: 'No se encontraron productos con los datos proveídos' });
        res.status(200).json(productos);
    } catch (error) {
        console.error('Error al obtener los productos:', error.message);
        res.status(500).json({ error: 'Error al obtener los productos.' });
    }
}

// Modificar los datos del producto según su _id
export async function putProduct(req, res) {
    try {
        const { categoria } = req.body;
        const prod0 = await Producto.findById(req.params._id);
        if (!prod0.activo) return res.status(400).json({ message: 'El producto no está activo, no se puede modificar.' });

        const restaurante = await Restaurante.findById(prod0.idRestaurante);
        if (!restaurante.activo) return res.status(400).json({ message: 'El restaurante no está activo, no se puede modificar el producto.' });

        if (categoria && !restaurante.categorias.includes(categoria)) return res.status(400).json({ message: 'La categoría proporcionada no es válida para este restaurante.' });

        const producto = await Producto.findByIdAndUpdate(req.params._id, req.body, { new: true });

        if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });

        const index = restaurante.productos.findIndex(p => p._id.toString() === req.params._id.toString());
        if (index >= 0) {
            restaurante.productos.splice(index, 1, producto);
            await restaurante.save();
        }

        res.status(200).json(producto);
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar el producto.' });
    }
}

// Inhabilitar un producto según la _id proveída
export async function deleteProduct(req, res) {
    try {
        const { _id } = req.params;
        const producto = await Producto.findByIdAndUpdate(_id, { activo: false }, { new: true });

        if (!producto) return res.status(404).json({ message: 'El producto que se está buscando no existe.' });

        const restaurante = await Restaurante.findById(producto.idRestaurante);
        const index = restaurante.productos.findIndex(p => p._id.toString() === req.params._id.toString());
        if (index >= 0) {
            restaurante.productos.splice(index, 1);
            await restaurante.save();
        }

        res.status(200).json({ message: 'El producto fue inhabilitado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al inhabilitar el producto.' });
    }
}

// Habilitar un producto según la _id proveída
export async function enableProduct(req, res) {
    try {
        const { _id } = req.params;
        const producto = await Producto.findByIdAndUpdate(_id, { activo: true }, { new: true });

        if (!producto) return res.status(404).json({ message: 'El producto que se está buscando no existe.' });

        const restaurante = await Restaurante.findById(producto.idRestaurante);
        restaurante.productos.push(producto);
        await restaurante.save();

        res.status(200).json({ message: 'El producto fue habilitado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al habilitar producto.' });
    }
}
