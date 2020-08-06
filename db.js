const { Client } = require('pg');
const client = new Client({
    host: 'localhost',
    user: 'postgres',
    password: 'postgres',
    database: 'super_real_pedido',
    port : '5432'
});
client.connect();

module.exports = client;
