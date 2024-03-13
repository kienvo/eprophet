var express = require('express');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';

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

function send_to_database(data) {
	MongoClient.connect(url).then((client) => {
		const db = client.db('local');
		const collection = db.collection('room1');

		data.timestamp = get_time_server();
		collection.insertOne(data);
		console.log("Gửi lên MongoDB thành công\n")
	}).catch((error) => {
		console.error('Lỗi khi lưu dữ liệu vào MongoDB:', error);
		console.log("")
		res.status(500).json({ error: "Lỗi khi lưu dữ liệu vào MongoDB" });
	})
}

router.post('/post/hardware_data', (req, res) => {
	const data = req.body;
	if (data) {
		console.log("Dữ liệu nhận được:", data);
		res.json({ message: "Dữ liệu đã được nhận thành công!" });

		if (data.U < 0 || data.U > 300) {
			console.log("Dữ liệu U bất thường")
		} else if (data.I < 0 || data.I > 1) {
			console.log("Dữ liệu I bất thường")
		} else if (data.lux < 0 || data.lux > 10000) {
			console.log("Dữ liệu lux bất thường")
		} else {
			send_to_database(data);
		}
	} else {
		res.status(400).json({ error: "Yêu cầu không chứa dữ liệu JSON" });
	}
});

router.get('/get_latest_data', function (req, res) {
    MongoClient.connect(url).then((client) => {
        const db = client.db('local');
        const getCollection = db.collection('room1');
    
        getCollection.find({dev_id: req.query.dev_id}).limit(req.query.length-'0').sort({timestamp:-1}).toArray().then((documents) => {
            documents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            dataserie={
                dev_id: req.query.dev_id,
                labels: documents.map(item => item.timestamp),
                datasets: [{
                    label: 'Vontage',
                    data: documents.map(item => item.U)
                },{
                    label: 'Current',
                    data: documents.map(item => item.I)
                },{
                    label: 'Lux',
                    data: documents.map(item => item.lux)
                }]
            };
            console.log("Found documents:", documents);
            res.json(dataserie);
        }).catch((error) => {
            console.error("Error fetching documents:", error);
        }).finally(() => {
            client.close();
        }).catch((error) => {
            console.error("Error connecting to MongoDB:", error);
        });
    });
});

module.exports = router;
