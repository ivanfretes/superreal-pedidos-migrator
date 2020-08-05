const request = require('request');
const db = require('./db');

const uri = 'https://real.geocom.com.uy/index.php/rest/V1/geoapi/index/remainingDispatchOrdersFilters';
const body = {
	username : "geocom",
	password : "g30c0m!",
	status : "PENDING,IN_PROCESS",
	local : 101
}

db.query('SELECT NOW()', (err, res) => {
  console.log(err, res)
  pool.end()
})
