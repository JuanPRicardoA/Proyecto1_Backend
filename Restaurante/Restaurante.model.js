const mongoose = require('mongoose');
const catgs = ['Comida ejecutiva', 'Comida rápida', 'Comida asiática', 'Comida vegana/vegetariana', 'Comida gourmet', 'Cafetería', 'Comida de mar'];
const estados = ['Creado', 'Enviado', 'Aceptado', 'Recibido', 'En dirección', 'Realizado'];

const restaurantSchema = mongoose.Schema({
    nombre: { type: String, required: [true, "El nombre del restaurante es obligatorio."] },
    direccion: { type: String, required: [true, "La dirección del restaurante es obligatoria."] },
    telefono: { type: String, required: [true, "El teléfono del restaurante es obligatorio."] },
    idAdministrador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    categoria: {
        type: String,
        required: [true, "La categoría del restaurante es obligatoria."],
        validate: {
            validator: function (v) {
                return catgs.includes(v);
            },
            message: props => `${props.value} no es una categoría válida.`
        }
    },
    pedidos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pedido' }],
    productos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Producto' }],
    categorias: [String],
    activo: { type: Boolean, default: true }
}, { timestamps: true });


export default mongoose.model('Restaurante', restaurantSchema);
