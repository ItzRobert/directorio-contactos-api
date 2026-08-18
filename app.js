const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const conectarDB = require("./config/db");
const rutasContactos = require("./routes/contactosRoutes.js");
dotenv.config();

const app = express();
const puerto = process.env.PORT || 3000;

conectarDB();

app.use(cors());
app.use(express.json());

 app.get("/", function(req, res) {
     res.send("API Directorio de Contactos funcionando correctamente");
 });
app.use("/api", rutasContactos);
app.listen(puerto, function() {
    console.log("Servidor iniciado en http://localhost:" + puerto);
});