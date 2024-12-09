// CONEXIÓN A LA BASE DE DATOS
// este archivo conecta la aplicación de Node.js a la bd mysql
const mysql = require('mysql');
const config = require('./config');

const db = mysql.createConnection({
    host: config.db.host,             // direccion del servidor
    user: config.db.user,                  // usuario de mysql
    password: config.db.password,       // contraseña de mysql
    database: config.db.database            // nombre de la base de datos
})

db.connect((err) =>{
    if(err){
        console.error('Error al conectar la base de datos: ', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos');
});

module.exports = db;