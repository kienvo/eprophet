var express = require('express');
var router = express.Router();

var cors = require('cors');
const { MongoNetworkError } = require('mongodb');

router.use('/', function (req, res, next) {
	// var key = req.query['api-key'];

	// // key isn't present
	// if (!key) return next(error(400, 'api key required'));

	// // key is invalid
	// if (apiKeys.indexOf(key) === -1) return next(error(401, 'invalid api key'))

	// // all good, store req.key for route access
	// req.key = key;
	next();
});

router.get('/dataserie', function (req, res) {
	res.send({
		labels: [
			'0h00', '0h05', '0h10', '0h15', '0h20', '0h25',
			'0h30', '0h35', '0h40', '0h45', '0h50', '0h55'
		],
		datasets: [{
			label: 'Energy',
			data: [12, 15, 3, 5, 2, 3, 12, 15, 3, 5, 2, 3],
			borderWidth: 3
		}]
	}
	);
});

function get_time_server() {
	const svt = new Date();
	// Convert to milliseconds
	const mlsc = svt.getTime();
	// Create a new Date object for UTC+7
	const nt = new Date(mlsc + 3600000 * 7);
	return nt;
}

router.post('/post/hardware_data', (req, res) => {
	var data = req.body
	if ( isMissing(["dev_id", "U", "I", "P", "lux", "localtime"], req.body, res) ) 
		return;

	if (isNaN(data.U) && isNaN(data.I) && isNaN(data.P) && isNaN(data.lux)) {
		msg = { msg: "U, I, P, lux should be a number" }
		console.log(msg);
		res.status(400).json(msg);
		return;
	}
	if (data.U < 0 || data.U > 400) {
		msg = { msg: "Voltage should be in range 0-400" }
		console.log(msg);
		res.status(400).json(msg);
		return;
	}
	if (data.I < 0 || data.I > 1) {
		msg = { msg: "Current should be in range 0-1" }
		console.log(msg);
		res.status(400).json(msg);
		return;
	}
	if (data.lux < 0 || data.lux > 10000) {
		msg = { msg: "Voltage should be in range 0-10000" }
		console.log(msg);
		res.status(400).json(msg);
		return;
	}

	console.log("raw received: ", JSON.stringify(data));
	
	data = {
		dev_id: data.dev_id,
		U: data.U,
		I: data.I,
		P: data.P,
		lux: data.lux,
		localtime: new Date(data.localtime),
		timestamp: new Date(get_time_server())
	}
	res.status(200).json({ msg: "Data has been saved", data });
	req.app.get('db').collection('deviceData').insertOne(data)
	.catch((error) => {
		res.status(400).json({ msg: "Error occured when saving data" }, error);
		return;
	})

});

router.get('/latest', cors(), function (req, res) {
	var devid=req.query.dev_id;
	var length=req.query.length;
	if(devid && length){
		length=parseInt(length, 10);
		var name_collection='';
		var time_sort=0;
		var qquery={dev_id: devid};
		if(length<0){
			name_collection='deviceData';
			time_sort=-1;
		}else{
			name_collection='predictData';
			time_sort=1;
			qquery={dev_id: devid, timestamp:{$gte: get_time_server()}};
		}
		const c = req.app.get('db').collection(name_collection);

		c.find(qquery).limit(Math.abs(length)).sort({timestamp:time_sort})
			.toArray().then((documents) => {
			documents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
			dataserie={
				dev_id: devid,
				labels: documents.map(item => item.timestamp),
				datasets: [{
					label: 'Voltage',
					data: documents.map(item => item.U)
				},{
					label: 'Current',
					data: documents.map(item => item.I)
				},{
					label: 'Power',
					data: documents.map(item => item.P)
				},{
					label: 'Lux',
					data: documents.map(item => item.lux)
				}]
			};
			res.json(dataserie);
		}).catch((error) => {
			console.error("Error fetching documents:");
		})
	}else{
		res.status(400).json({ error: "Thiếu dev_id hoặc length" });
	}
});


router.get('/raw', cors(), function (req, res) 
{
	if ( isMissing(["dev_id", "length"], req.query, res) ) return;
	if (req.query.dev_id.length != 17) {
		res.status(400).json({ error: "dev_id should be a mac address" });
		return;
	}
	len=parseInt(req.query.length, 10);
	if (isNaN(len)) {
		res.status(400).json({ error: "length should be a number" });
		return;
	}

	var coll='';
	var sort=0;
	var q={dev_id: req.query.dev_id};
	if(len<0){
		coll='deviceData';
		sort=-1;
	}else{
		coll='predictData';
		sort=1;
		q={dev_id: req.query.dev_id, timestamp:{$gte: get_time_server()}};
	}
	const c = req.app.get('db').collection(coll);

	c.find(q).limit(Math.abs(len)).sort({timestamp:sort})
		.toArray().then((documents) => {
		documents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
		
		res.json(documents);
	}).catch((error) => {
		console.error("Error fetching documents:");
	})
});

const isMissing = (keys, obj, res) => {
	for (const k of keys) {
		if (! Object.keys(obj).includes(k)) {			
			msg = { msg : "Missing " + k};
			res.status(400).json(msg);
			res.end()
			console.log(msg);
			return true
		}
	}
	return false
}

const isDateValid = (dateStr) => {
	return !isNaN(new Date(dateStr));
}

const qconsum = (q) => { return [{
	$match: {
		dev_id: q.dev_id,
		timestamp: {
			$gte: new Date(new Date(q.d1).toDateString() + ' 00:00:00 UTC+0'),
			$lte: new Date(new Date(q.d2).toDateString() + ' 23:59:59 UTC+0')
		}
	}
}, {
	$group: {
		_id: {
			$dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
		}, consumption: {
			$sum: '$P'
		}, nsample: {
			$sum: 1
		}
	}
}, {
	$sort: {_id: 1}
}, { 
	$project: {
		_id: 0,
		date: '$_id',
		nsample: 1,
		// sum/(<minute of a day>/<number of sample in that day>)
		consumption: {
			$divide: ['$consumption', { $divide: [1440, '$nsample'] }]
		},
		unit: 'Wh'
	}
}]}

const dbquery = (coll, query, res) => {
	coll.aggregate(query).toArray().then((d) => {		
		res.json(d);
	}).catch((error) => {
		res.status(400).json({ error: "Error fetching documents:" });
		console.error("Error fetching documents:", error);
	})
}

router.get('/consum', cors(), function (req, res) 
{
	if ( isMissing(["dev_id", "d1", "d2"], req.query, res) ) return;
	
	if (req.query.dev_id.length != 17) {
		msg = { error: "dev_id should be a mac address" };
		res.status(400).json(msg);
		console.log(msg);
		return;
	}
	if ( ! isDateValid(req.query.d1)) {
		msg = { error: "d1 is not a valid date. It should in ISO format" }
		res.status(400).json(msg);
		console.log(msg);
		return;
	}
	if ( ! isDateValid(req.query.d2)) {
		msg = { error: "d2 is not a valid date. It should in ISO format" }
		res.status(400).json(msg);
		console.log(msg);
		return;
	}
	dbquery(req.app.get('db').collection('deviceData'), qconsum(req.query), res)
});

router.get('/consum-fc', cors(), function (req, res) 
{
	if ( isMissing(["dev_id", "d1", "d2"], req.query, res) ) return;
	
	if (req.query.dev_id.length != 17) {
		msg = { error: "dev_id should be a mac address" };
		res.status(400).json(msg);
		console.log(msg);
		return;
	}
	if ( ! isDateValid(req.query.d1)) {
		msg = { error: "d1 is not a valid date. It should in ISO format" }
		res.status(400).json(msg);
		console.log(msg);
		return;
	}
	if ( ! isDateValid(req.query.d2)) {
		msg = { error: "d2 is not a valid date. It should in ISO format" }
		res.status(400).json(msg);
		console.log(msg);
		return;
	}

	dbquery(req.app.get('db').collection('predictData'), qconsum(req.query), res)
});

router.get('/inrange', cors(), function (req, res) {
	var devid=req.query.dev_id;
	var t1=req.query.t1;
	var t2=req.query.t2;
	if(devid && t1 && t2){
		var qquery={dev_id: devid,timestamp:{$gte: new Date(t1), $lt:new Date(t2)}};
		const c = req.app.get('db').collection('deviceData');

		c.find(qquery).sort({timestamp:1}).toArray().then((documents) => {
			documents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
			dataserie={
				dev_id: devid,
				labels: documents.map(item => item.timestamp),
				datasets: [{
					label: 'Voltage',
					data: documents.map(item => item.U)
				},{
					label: 'Current',
					data: documents.map(item => item.I)
				},{
					label: 'Power',
					data: documents.map(item => item.P)
				},{
					label: 'Lux',
					data: documents.map(item => item.lux)
				}]
			};
			res.json(dataserie);
		}).catch((error) => {
			console.error("Error fetching documents:");
		})
	}else{
		res.status(400).json({ error: "Thiếu dev_id, t1 hoặc t2" });
	}
});

router.get('/all', cors(), function (req, res) {
	var devid=req.query.dev_id;
	if(devid){
		var qquery={dev_id: devid};
		const c = req.app.get('db').collection('deviceData');

		c.find(qquery).sort({timestamp:1}).toArray().then((documents) => {
			dataserie={
				dev_id: devid,
				timestamp: documents.map(item => item.timestamp),
				datasets: [{
					label: 'Voltage',
					unit: 'V',
					data: documents.map(item => item.U)
				},{
					label: 'Current',
					unit: 'A',
					data: documents.map(item => item.I)
				},{
					label: 'Power',
					unit: 'W',
					data: documents.map(item => item.P)
				},{
					label: 'Lux',
					unit: 'lux',
					data: documents.map(item => item.lux)
				}]
			};
			
			res.json(documents);
		}).catch((error) => {
			console.error("Error fetching documents:");
		})
	}else{
		res.status(400).json({ error: "Thiếu dev_id" });
	}
});

module.exports = router;
