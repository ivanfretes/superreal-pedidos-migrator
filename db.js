const { Client } = require('pg');
const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'postgres',
    database: 'super_real_pedido',
});
client.connect();

module.exports = client;
