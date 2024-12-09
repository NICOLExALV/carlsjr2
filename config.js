const port = process.env.port||3000;
const dbhost = process.env.dbhost||" ";
const dbuser = process.env.user||" ";
const dbpassword = process.env.password||" ";
const name = process.env.name||" ";
const portdb = process.env.dbport||" ";

module.exports = {
    port,
    dbhost,
    dbuser,
    dbpassword,
    name,
    portdb
};


