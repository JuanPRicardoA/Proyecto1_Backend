import Restaurante from './Restaurante.model';

// -------------------------------------------- CRUD de restaurantes --------------------------------------------

//Crear nuevo restaurante
export async function createRestaurant(req, res) {
    try {
        const { nombre, direccion, telefono, categoria } = req.body;
        const restaurante = new Restaurante({ nombre, direccion, telefono, categoria })
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
        const restaurante = await Restaurante.findOne({ _id: req.params._id, activo: true });

        if (!restaurante) return res.status(404).json({ message: 'No se encontró restaurante con esa ID o está inhabilitado' });
        res.status(200).json(restaurante);
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

        const restaurantes = await Restaurante.find(query);

        if (!restaurantes.length) return res.status(404).json({ message: 'No se encontraron restaurantes con los datos proveídos' });
        res.status(200).json(restaurantes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Modificar los datos del restaurante según su _id
const catgs = ['Comida ejecutiva', 'Comida rápida', 'Comida asiática', 'Comida vegana/vegetariana', 'Comida gourmet', 'Cafetería', 'Comida de mar'];
export async function putRestaurant(req, res) {
    try {
        const { catg } = req.body;
        const rest0 = await Restaurante.findById(req.params._id)
        if (!rest0.activo) return res.status(400).json({ message: 'El restaurante no está activo, no se puede modificar' });

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
        const restaurante = await Restaurante.findByIdAndUpdate(_id, { activo: true }, { new: true });

        if (!restaurante) return res.status(404).json({ message: 'El restaurante que se está buscando no existe.' });
        res.status(200).json({ message: 'El restaurante fue habilitado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al habilitar restaurante.' });
    }
}