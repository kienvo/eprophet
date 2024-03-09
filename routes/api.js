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

module.exports = router;
