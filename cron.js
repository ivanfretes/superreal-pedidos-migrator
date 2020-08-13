const CronJob = require('cron').CronJob;
const migrarPedido = require('./migrar-pedidos')

const job = new CronJob('* */3 * * * *', async function() {
    const d = new Date();
	console.log(d);
}, null, true, 'America/Asuncion');

migrarPedido(job)
job.start();