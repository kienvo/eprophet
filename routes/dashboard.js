var express = require('express');
var router = express.Router({ mergeParams: true });

router.get('/', function(req, res, next) {
	res.render('dashboard/dashboard', { 
		title: 'Dashboard of device: ' + req.params.dev_id ,

		pwChConfig: {
			baseUrl: 'http://rockwell.eproject.kienlab.com/api/raw',
			dev_id: req.params.dev_id,
			devDataLen: 200,
			predDataLen: 100,
			dataLabel: 'Power (W)',
			yAxisKey: 'P', // data field
			xAxisKey: 'timestamp', // time field
			chartTitle: "POWER",
		}, 

		consumChConfig: {
			predBaseUrl: 'http://rockwell.eproject.kienlab.com/api/consum-fc',
			devBaseUrl: 'http://rockwell.eproject.kienlab.com/api/consum',
			dev_id: req.params.dev_id,
			chartTitle: "POWER CONSUMTION IN RECENT DATES",
			dataLabel: 'Power Consumption (Wh)',
			xAxisKey: 'consumption', // data field
			yAxisKey: 'date', // time field
		}
	});
});

module.exports = router;
