var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
	// res.render('charts/', { title: 'Dashboard' });
	next();
});

router.get('/power', function(req, res, next) {
	res.render('charts/power', {
		title: 'POWER',
		
		pwChConfig: {
			baseUrl: 'http://rockwell.eproject.kienlab.com/api/raw',
			dev_id: 'D4:8A:FC:A5:ED:E0',
			devDataLen: 100,
			predDataLen: 100,
			dataLabel: 'Power (W)',
			yAxisKey: 'P', // data field
			xAxisKey: 'timestamp', // time field
			chartTitle: "POWER",
		}, 
	});
});

module.exports = router;
