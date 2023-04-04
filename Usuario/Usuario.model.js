const mongoose = require('mongoose');
const roles = ['Administrador', 'Cliente', 'Domiciliario'];

const usuarioSchema = mongoose.Schema({
    nombre: { type: String, required: [true, "El nombre del usuario es obligatorio."] },
    email: { type: String, required: [true, "El email es obligatorio."] },
    contraseña: { type: String, required: [true, "La contraseña es obligatoria."] },
    telefono: { type: String, required: [true, "El teléfono celular es obligatorio."] },
    direccion: { type: String, required: [true, "La dirección del usuario es obligatoria."] },
    rol: {
        type: String,
        required: [true, "El rol es obligatorio."],
        validate: {
            validator: function (v) {
                return roles.includes(v);
            },
            message: props => `${props.value} no es un rol válido`
        }
    },
    activo: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Usuario', usuarioSchema);
