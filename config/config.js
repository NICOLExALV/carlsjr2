// CONFIGURACIÓN GENERAL
require('dotenv').config(); //cargar variable de entorno desde file .env

module.exports = {
    // config de la bd
    db:{
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        dialect: 'mysql', // tipo de bd
        logging: false // desactiva los logs de la consola
    },
    // config del JWT
    jwt:{
        secret: process.env.JWT_SECRET,
        expiresIn: '1h'
    }
};