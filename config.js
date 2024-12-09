const port = process.env.port||3000;
const dbhost = process.env.dbhost||"junction.proxy.rlwy.net";
const dbuser = process.env.user||"root";
const dbpassword = process.env.password||"vEHNtIOAVbxLECFwKdYfjaSTjVEJAmtv";
const name = process.env.name||"railway";
const portdb = process.env.dbport||"16907";

module.exports = {
    port,
    dbhost,
    dbuser,
    dbpassword,
    name,
    portdb
};