const mongoose = require("mongoose");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function conectarDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB conectado correctamente");
    } catch (error) {
        console.log("Error al conectar con MongoDB:", error.message);
    }
}

module.exports = conectarDB;