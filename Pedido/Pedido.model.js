const mongoose = require('mongoose');
const estados = ['Creado', 'Enviado', 'Aceptado', 'Recibido', 'En dirección', 'Realizado'];

const pedidoSchema = mongoose.Schema({
    productos: [{
        nombre: { type: String, required: [true, "El nombre del producto es obligatorio."] },
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto' },
        cantidad: { type: Number, required: [true, "La cantidad del producto es obligatoria."] }
    }],
    direccion: { type: String },
    estado: { type: String, default: 'Creado', enum: estados },
    nombreRestaurante: { type: String },
    idRestaurante: { type: String },
    nombreUsuario: { type: String },
    idUsuario: { type: String, required: [true, "El ID del usuario es obligatorio."] },
    activo: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Pedido', pedidoSchema);

