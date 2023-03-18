import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Usuario from './Usuario'
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

    if (!user) {
      throw new Error('No se encontró el usuario o sus credenciales son inválidas.');
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Modificar los datos del usuario según su _id
app.put('/usuarios/:_id', async (req, res) => {
  try {
    const user = await Usuario.findByIdAndUpdate(req.params._id, req.body, { new: true, });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Inhabilitar un usuario según la _id proveída
app.delete('/usuarios/:_id', async (req, res) => {
  try {
    const { _id } = req.params;
    const user = await Usuario.findByIdAndDelete(_id);

    if (!user) {
      return res.status(404).json({ message: 'El usuario que se está buscando no existe.' });
    }

    res.status(200).json({ message: 'El usuario fue borrado.' });
  } catch (err) {
    res.status(500).json({ message: 'Error al borrar usuario.' });
  }
});

// Iniciar la aplicación
app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});