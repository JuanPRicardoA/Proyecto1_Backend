import Usuario from './Usuario.model';

// -------------------------------------------- CRUD de usuarios --------------------------------------------

// Crear nuevo usuario
export async function createUser(req, res) {
    try {
        const { nombre, email, contraseña, telefono, direccion, rol } = req.body;
        const usuario = new Usuario({ nombre, email, contraseña, telefono, direccion, rol })
        const resultado = await usuario.save();
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error creando el usuario:', error.message);
        res.status(500).json({ error: 'Error al crear usuario.' });
    }
}

//Retornar datos según las credenciales o la _id
export async function getUser(req, res) {
    try {
        const { email, contraseña, _id } = req.query;
        let user;

        if (_id) {
            user = await Usuario.findOne({ _id, activo: true });
        } else if (email && contraseña) {
            user = await Usuario.findOne({ email, contraseña, activo: true });
        } else {
            throw new Error('No hay suficientes parámetros para buscar.');
        }

        if (!user) throw new Error('No se encontró el usuario o sus credenciales son inválidas.');

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Modificar los datos del usuario según su _id
const roles = ['Administrador', 'Cliente', 'Domiciliario'];
export async function putUser(req, res) {
    try {
        const { rol } = req.body;
        const user0 = await Usuario.findById(req.params._id);
        if (!user0.activo) return res.status(400).json({ message: 'El usuario no está activo, no se puede modificar' });

        if (rol && !roles.includes(rol)) return res.status(400).json({ message: 'Rol no válido' });

        const user = await Usuario.findByIdAndUpdate(req.params._id, req.body, { new: true });

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar al usuario' });
    }
}

// Inhabilitar un usuario según la _id proveída
export async function deleteUser(req, res) {
    try {
        const { _id } = req.params;
        const user = await Usuario.findByIdAndUpdate(_id, { activo: false }, { new: true });

        if (!user) return res.status(404).json({ message: 'El usuario que se está buscando no existe.' });
        res.status(200).json({ message: 'El usuario fue inhabilitado.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al inhabilitar usuario.' });
    }
}