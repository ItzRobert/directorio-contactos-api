const mongoose = require("mongoose");

const contactoSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    nombre: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },

    telefono: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },

    correo: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    empresa: {
        type: String,
        trim: true,
        maxlength: 100
    },

    notas: {
        type: String,
        trim: true,
        maxlength: 500
    }
});

module.exports = mongoose.model("Contacto", contactoSchema);