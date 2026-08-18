const mongoose = require("mongoose")
const Contactos = require("../models/Contacto.js");



exports.get = async (req, res) => {
    try{
        
    var listaContactos = await Contactos.find();
    res.json(listaContactos)
    
}
catch(error){
    res.status(404).json({message: "No se pudieron cargar las informaciones de los contactos.", error : error.message});}}



exports.getByName = async (req, res) => {
try{
    var contactosFiltrado = await Contactos.find({
        nombre : {$regex : req.params.nombre, $options: 'i'}
    });
    res.json(contactosFiltrado);
}
catch(error){ res.status(404).json({message:"No se pudo obtener al usuario por su nombre", error:error.message})}
}

exports.post = async (req, res) => {
    try {
        if(!req.body || Object.keys(req.body).length === 0){res.status(400).json({message : "El cuerpo del nuevo contacto no puede estar vacio"}); return;}
    var nuevoContacto = new Contactos(req.body)
    var nuevoContactoGuardado = await nuevoContacto.save();
    res.status(201).json(nuevoContactoGuardado);
}catch (error){res.status(400).json({message :"No se pudo crear al usuario", error: error.message})}
}

exports.put = async (req,res) =>{
    try{
    if(!req.body || Object.keys(req.body).length === 0){res.status(400).json({message : "El cuerpo del nuevo contacto no puede estar vacio"}); return;}
    
    var idContactoActualizado = req.params._id;
    var nuevosDatosContacto = req.body;
    
    if (!nuevosDatosContacto) {
        res.status(404).json({message:"Los datos no pueden estar vacios."})
    }
    var contactoActualizado = await Contactos.findByIdAndUpdate(idContactoActualizado, nuevosDatosContacto, {new : true}); 
    res.status(201).json(contactoActualizado)
    } catch(error) {res.status(400).json({message: "No se pudieron actualizar los datos.", error:error.message})}
}
exports.delete = async (req,res) => {
   try{
    var contactoEliminarId = req.params._id;
    var contactoEliminar = req.body;
    var contactoEliminado = await Contactos.findByIdAndDelete(contactoEliminarId, contactoEliminar);
    res.status(200).json(contactoEliminado);
}
catch(error){res.status(404)}
}