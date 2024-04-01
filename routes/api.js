var express = require('express');
var router = express.Router();

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
	console.log("Server time: ", nt)
	return nt;
}

router.post('/post/hardware_data', (req, res) => {
	const data = req.body;
	if (data.id && data.U && data.I && data.P && data.lux && data.localtime) {
		console.log("Dữ liệu nhận được:", data);
		res.json({ message: "Dữ liệu đã được nhận thành công!" });

		if (data.U < 0 || data.U > 300) {
			console.log("Dữ liệu U bất thường")
		} else if (data.I < 0 || data.I > 1) {
			console.log("Dữ liệu I bất thường")
		} else if (data.lux < 0 || data.lux > 10000) {
			console.log("Dữ liệu lux bất thường")
		} else {
			data1={
				id: data.id,
				U: data.U,
				I: data.I,
				P: data.P,
				lux: data.lux,
				localtime: data.localtime,
				timestamp: get_time_server()
			}
			console.log(req.app.get('db'))
			req.app.get('db')
				.collection('deviceData').insertOne(data1);
		}
	} else {
		res.status(400).json({ error: "Dữ liệu không đúng định dạng" });
	}
});

router.get('/latest', function (req, res) {
	var devid=req.query.dev_id;
	var length=req.query.length;
	if(devid && length){
		length=parseInt(length, 10);
		var name_collection='';
		var time_sort=0;
		var qquery={id: devid};
		if(length<0){
			name_collection='deviceData';
			time_sort=-1;
		}else{
			name_collection='predictData';
			time_sort=1;
			qquery={id: devid, timestamp:{$gte: get_time_server()}};
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


router.get('/raw', function (req, res) 
{
	if (!req.query.dev_id) {
		res.status(400).json({ error: "Missing dev_id" });
		return;
	}
	if (req.query.dev_id.length != 17) {
		res.status(400).json({ error: "dev_id should be a mac address" });
		return;
	}
	if (!req.query.length) {
		res.status(400).json({ error: "Missing length" });
		return;
	}
	if (!req.query.length) {
		res.status(400).json({ error: "Missing length" });
		return;
	}
	len=parseInt(req.query.length, 10);
	if (isNaN(len)) {
		res.status(400).json({ error: "length should be a number" });
		return;
	}

	var coll='';
	var sort=0;
	var q={id: req.query.dev_id};
	if(len<0){
		coll='deviceData';
		sort=-1;
	}else{
		coll='predictData';
		sort=1;
		q={id: req.query.dev_id, timestamp:{$gte: get_time_server()}};
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

router.get('/inrange', function (req, res) {
	var devid=req.query.dev_id;
	var t1=req.query.t1;
	var t2=req.query.t2;
	if(devid && t1 && t2){
		var qquery={id: devid,timestamp:{$gte: new Date(t1), $lt:new Date(t2)}};
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

router.get('/all', function (req, res) {
	var devid=req.query.dev_id;
	if(devid){
		var qquery={id: devid};
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
