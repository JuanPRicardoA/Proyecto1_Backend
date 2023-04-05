import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
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

import UsuarioRoutes from './Usuario/Usuario.routes'
app.use('/usuarios', UsuarioRoutes);

import RestauranteRoutes from './Restaurante/Restaurante.routes'
app.use('/restaurantes', RestauranteRoutes)

import ProductoRoutes from './Producto/Producto.routes'
app.use('/restaurantes', ProductoRoutes)

// Endpoint para 404
app.use((req, res) => {
  res.status(404).json({ message: 'No encontrado' });
});

// Iniciar la aplicación
app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});