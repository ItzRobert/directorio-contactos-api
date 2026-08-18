const mongoose = require("mongoose");
const app = require("express");
const router = app.Router();
const contactosController = require('../controllers/ContactoController.js');

router.get('/get', contactosController.get);
router.get('/getByName/:nombre', contactosController.getByName);
router.post('/post', contactosController.post);
router.put('/put/:_id', contactosController.put);
router.delete('/delete/:_id', contactosController.delete);
module.exports = router;
