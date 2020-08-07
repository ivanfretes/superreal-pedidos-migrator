const request = require('request');
const db = require('./db');

const uri = 'https://real.geocom.com.uy/index.php/rest/V1/geoapi/index/remainingDispatchOrdersFilters';
const body = {
	username : "geocom",
	password : "g30c0m!",
	status : "PENDING,IN_PROCESS",
	local : 101
}

// Import mock
const _items = require('./mock');

/**
 * Consulta los datos 
 */
request.post(uri, {
    headers : {
        'Content-Type': 'application/json',
        'Accept' : 'application/json'
    },
    body : JSON.stringify(body)
}, async (error, response) => {
    try {
        truncate_tables_db();
        
        if (response.statusCode == 400)
            throw (JSON.parse(response.body));
        
        const _res = JSON.parse(response.body);    
        const pedidos = _res.data;

        // Se insertan los pedidos
        for (const pedido of pedidos) {
            const { items, header, dispatchdata } = pedido;
            insert_pedidos_en_db(header, dispatchdata);
        }
        
    } catch (e) {
        console.log(response.statusCode);
        console.log(e.message);
    } finally{
        console.log('Proceso finalizado')
    }
});

/**
 * Vacia las tablas en cuestion
 */
const truncate_tables_db = async () => {
    try {
        const tables = ['detalle_pedidos', 'pedidos'];
        tables.forEach(async table => {
            await db.query(`TRUNCATE TABLE ${table} CASCADE`);
        });    

        console.log('Truncado correcto');

    } catch (error) {
        console.error(error)
    }
}

/**
 * Inserta pedidos en la DB, si se genera algun conflicto hace un rollback
 */

const insert_pedidos_en_db = async (pedidoHeader, pedidoData) => {
    let {
        nro_pedido, cajero , fecha_creacion , local_nombre_zona, estado } = pedidoHeader;

    // NOMBRE DEL CLIENTE, TELEFONO, FECHA DE ENTREGA, FRANJA HORARIA DE ENTREGA
    let { 
        nombre, telefono, entrega_programada_fecha, entrega_programada } = pedidoData

    try {
        // Inserta el pedido
        cajero = `Cajero ${nro_pedido}`;

        await db.query('BEGIN');
        const queryText = `
            INSERT INTO pedidos(num_pedido, supervisor , picker , fecha , sucursal, estado) 
            VALUES($1, $2, $3, $4, $5, $6 )`;
        await db.query(queryText, [
            nro_pedido, `Supervisor ${nro_pedido}` , cajero,  fecha_creacion , local_nombre_zona, estado
        ]);

        // Inserta los detalles
        get_list_detalle_pedido(nro_pedido);
        await db.query('COMMIT');
        
    } catch (e) {
        await db.query('ROLLBACK')
        throw e;
    } finally{
        console.log(`Pedido nro ${nro_pedido} migrado...`)
    }
};

const CATEGORIA = 'CATEGORIA';
const OBS = '--';

/**
 * Retornar el listado de detalles por pedido
 * @param {*} nro_pedido 
*/
const get_list_detalle_pedido = async (nro_pedido) => {
    let uri = 'https://real.geocom.com.uy/index.php/rest/V1/geoapi/index/salesOrder';
    body['order_id'] = nro_pedido;

    request.post(uri, {
        headers : {
            'Content-Type' : 'application/json',
            'Accept' : 'application/json'
        },
        body : JSON.stringify(body)
    }, async (error, response) => {
        const _response = JSON.parse(response.body);
        const { header, items } = _response.data;
        const { codigo_barras } = header;

        let queryText = `
                INSERT INTO detalle_pedidos(num_pedido, codigo_barra, descripcion, cantidad, categoria, obs) 
                VALUES ($1, $2, $3, $4, $5, $6) `;

        for (const item of items) {
            let { descripcion, cantidad, sku } = item;

            db.query(queryText, [nro_pedido, sku, descripcion, parseFloat(cantidad), CATEGORIA, OBS]);    
            console.log(`\tDetalle ${sku} migrado`)
        }

        console.log('==============');
        return;
    });   
}
