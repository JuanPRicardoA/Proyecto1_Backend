const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    nombre: { type: String, required: [true, "El nombre del producto es obligatorio."] },
    descripcion: { type: String, required: [true, "La descripción del producto es obligatoria."] },
    precio: { type: Number, required: [true, "El precio es obligatorio."] },
    categoria: { type: String, required: [true, "La categoría del producto es obligatoria."] },
    activo: { type: Boolean, default: true },
    nombreRestaurante: {type: String},
    idRestaurante: {type: String}
}, { timestamps: true });


export default mongoose.model('Producto', productSchema);
