import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Usuario from './Usuario'
import Restaurante from './Restaurante';
import { getSupportInfo } from 'prettier';
const app = express();

app.use(cors());
app.use(express.json());

// Conexión a la base de datos
mongoose
  .connect(
    'mongodb+srv://' +
    process.env.MONGO_USER +
    ':' +
    process.env.MONGO_PASS +
    '@cluster1.mctzyp3.mongodb.net/BD-Proyecto1?retryWrites=true&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log('Conectado a la base de datos de MongoDB.');
  })
  .catch((err) => { console.error('Error de conexión a la BD de MongoDB:', err.message); });
mongoose.Promise = global.Promise;

// -------------------------------------------- CRUD de usuarios --------------------------------------------

// Crear nuevo usuario
app.post('/usuarios', async (req, res) => {
  try {
    const { nombre, email, contraseña, telefono, direccion, rol } = req.body;
    const usuario = new Usuario({ nombre, email, contraseña, telefono, direccion, rol })
    const resultado = await usuario.save();
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error creando el usuario:', error.message);
    res.status(500).json({ error: 'Error al crear usuario.' });
  }
});

//Retornar datos según las credenciales o la _id
app.get('/usuarios', async (req, res) => {
  try {
    const { email, contraseña, _id } = req.query;
    let user;

    if (_id) {
      user = await Usuario.findById(_id);
    } else if (email && contraseña) {
      user = await Usuario.findOne({ email, contraseña });
    } else {
      throw new Error('No hay suficientes parámetros para buscar.');
    }

    if (!user) throw new Error('No se encontró el usuario o sus credenciales son inválidas.');

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Modificar los datos del usuario según su _id
app.put('/usuarios/:_id', async (req, res) => {
  try {
    const user = await Usuario.findByIdAndUpdate(req.params._id, req.body, { new: true, });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar al usuario' });
  }
});

// Inhabilitar un usuario según la _id proveída
app.delete('/usuarios/:_id', async (req, res) => {
  try {
    const { _id } = req.params;
    const user = await Usuario.findByIdAndDelete(_id);

    if (!user) return res.status(404).json({ message: 'El usuario que se está buscando no existe.' });

    res.status(200).json({ message: 'El usuario fue borrado.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al borrar usuario.' });
  }
});

// -------------------------------------------- CRUD de restaurantes --------------------------------------------

//Crear nuevo restaurante
app.post('/restaurantes', async (req, res) => {
  try {
    const { nombre, direccion, telefono, categoria } = req.body;
    const restaurante = new Restaurante({ nombre, direccion, telefono, categoria })
    const resultado = await restaurante.save();
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error creando el restaurante:', error.message);
    res.status(500).json({ error: 'Error al crear restaurante.' });
  }
});

//Retornar datos según la _id
app.get('/restaurantes/:_id', async (req, res) => {
  try {
    const restaurante = await Restaurante.findById(req.params._id);

    if (!restaurante) return res.status(404).json({ message: 'No se encontró restaurante con esa ID' });
    res.status(200).json(restaurante);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el restaurante' });
  }
});

//Retorna datos de restaurantes  según la categoría y/o nombres que se asemejen
app.get('/restaurantes', async (req, res) => {
  try {
    const { categoria, nombre } = req.query;
    const query = {};

    if (categoria) query.categoria = categoria;
    if (nombre) query.nombre = { $regex: `${nombre}`, $options: 'i' }; //${nombre} exp regular para búsqueda no estricta, $options: 'i' para que la búsqueda no tenga en cuenta si hay mayúsculas o minúsculas 

    const restaurantes = await Restaurante.find(query);

    if (!restaurantes.length) return res.status(404).json({ message: 'No se encontraron restaurantes con los datos proveídos' });
    res.status(200).json(restaurantes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Modificar los datos del restaurante según su _id
app.put('/restaurantes/:_id', async (req, res) => {
  try {
    const restaurante = await Restaurante.findByIdAndUpdate(req.params._id, req.body, { new: true });

    if (!restaurante) return res.status(404).json({ message: 'Restaurante no encontrado' });
    res.status(200).json(restaurante);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar el restaurante' });
  }
});

// Inhabilitar un restaurante según la _id proveída
app.delete('/restaurantes/:_id', async (req, res) => {
  try {
    const { _id } = req.params;
    const restaurante = await Restaurante.findByIdAndDelete(_id);

    if (!restaurante) return res.status(404).json({ message: 'El restaurante que se está buscando no existe.' });
    res.status(200).json({ message: 'El restaurante fue borrado.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al borrar el restaurante.' });
  }
});

// Iniciar la aplicación
app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});